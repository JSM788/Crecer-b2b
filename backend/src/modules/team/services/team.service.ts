import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService, Transaction } from '../../../database/prisma.service';
import { Principal } from '../../../common/types/principal';
import { reject, rejectField, isUniqueConstraint } from '../../../common/errors/application-error';
import { pageResult } from '../../../common/pagination';
import type { PaginationQuery } from '../../../common/pagination';
import { memberUserSelection, memberInvitationSelection, memberInvitationResponse } from '../../platform/services/member-response';
import { MemberListQuery } from '../../platform/dto/platform.dto';
import { teamMemberResponseSchema, TeamProfileInput } from '../dto/team.dto';
import { memberResponse } from '../../platform/services/member-response';
import { recordAccessEvent } from '../../identity/services/access-events';
import { revokeAccessLinks } from '../../identity/services/revoke-access-links';
import { Prisma } from '../../../generated/prisma/client';
import { InvitationsService } from '../../invitations/invitations.service';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService, private readonly invitations: InvitationsService, private readonly mail: MailService) {}

  private async requireManager(tx: Transaction, principal: Principal) {
    const session = await tx.session.findFirst({ where: {
      tokenHash: principal.tokenHash, companyId: principal.companyId, membershipId: principal.membershipId,
      expiresAt: { gt: new Date() },
      membership: { active: true, role: 'manager', company: { status: 'active' } },
    } });
    if (!session) reject('team_forbidden');
  }

  list(principal: Principal, query: MemberListQuery) {
    return this.prisma.transaction(async (tx) => {
      await this.requireManager(tx, principal);
      const where: Prisma.MembershipWhereInput = {
        companyId: principal.companyId,
        ...(query.role ? { role: query.role } : {}),
        ...(query.active !== undefined ? { active: query.active } : {}),
        user: { isPlatformOwner: false, ...(query.search ? { OR: [{ email: { contains: query.search, mode: 'insensitive' } }, { displayName: { contains: query.search, mode: 'insensitive' } }] } : {}) },
      };
      const [members, total] = await Promise.all([
        tx.membership.findMany({ where, include: { user: { select: memberUserSelection }, invitations: memberInvitationSelection }, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
        tx.membership.count({ where }),
      ]);
      return pageResult(members.map((member) => teamMemberResponseSchema.parse({
        id: member.id, userId: member.userId, companyId: member.companyId, displayName: member.user.displayName,
        phone: member.user.phone,
        email: member.user.email, role: member.role, active: member.active, ...memberInvitationResponse(member),
      })), total, query);
    });
  }

  async editProfile(principal: Principal, key: string, membershipId: string, input: TeamProfileInput) {
    const companyId = principal.companyId;
    const fingerprint = createHash('sha256').update(JSON.stringify(['team_edit_profile', membershipId, input])).digest('hex');
    try {
      return await this.prisma.transaction(async tx => {
        await this.requireManager(tx, principal);
        for (const id of [...new Set([principal.membershipId, membershipId])].sort())
          await tx.membership.updateMany({ where: { id, companyId }, data: { transitionVersion: { increment: 1 } } });
        await this.requireManager(tx, principal);
        const identity = { companyId, membershipId: principal.membershipId, key };
        const existing = await tx.operation.findUnique({ where: { companyId_membershipId_key: identity } });
        if (existing) {
          if (existing.fingerprint !== fingerprint) reject('idempotency_key_reused');
          return teamMemberResponseSchema.parse(existing.response);
        }
        const member = await tx.membership.findFirst({ where: { id: membershipId, companyId, user: { isPlatformOwner: false } }, include: { user: { select: memberUserSelection } } });
        if (!member) reject('platform_member_not_found');
        if (await tx.membership.count({ where: { userId: member.userId, companyId: { not: companyId } } })) reject('team_shared_identity');
        const duplicate = await tx.user.findUnique({ where: { email: input.email }, select: { id: true } });
        if (duplicate && duplicate.id !== member.userId) rejectField('platform_identity_exists', ['email']);
        const emailChanged = member.user.email !== input.email;
        if (emailChanged) await revokeAccessLinks(tx, member.userId, principal.userId, 'email_changed');
        await tx.user.update({ where: { id: member.userId }, data: input });
        if (emailChanged) {
          await tx.session.deleteMany({ where: { membership: { userId: member.userId } } });
          if (member.active && member.user.passwordHash === null)
            await this.invitations.issue(tx, companyId, membershipId, principal.userId);
        }
        const changed = (['displayName', 'email', 'phone'] as const).filter(field => member.user[field] !== input[field]);
        if (changed.length) await recordAccessEvent(tx, { userId: member.userId, companyId, membershipId, actorUserId: principal.userId, event: 'account_updated', outcome: 'completed', details: { changed, ...(emailChanged ? { previousEmail: member.user.email, email: input.email } : {}), ...(member.user.phone !== input.phone ? { previousPhone: member.user.phone, phone: input.phone } : {}) } });
        const updated = await tx.membership.findUniqueOrThrow({ where: { id: membershipId }, include: { user: { select: memberUserSelection }, invitations: memberInvitationSelection } });
        const response = teamMemberResponseSchema.parse(memberResponse(updated));
        await tx.operation.create({ data: { ...identity, fingerprint, response } });
        await tx.auditEntry.create({ data: { companyId, membershipId: principal.membershipId, action: 'team_edit_profile', subjectId: membershipId } });
        return response;
      }).then(response => { this.mail.kick(); return response; });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && isUniqueConstraint(error, 'User', ['email'], 'users_email_key')) rejectField('platform_identity_exists', ['email']);
      throw error;
    }
  }

  resendInvitation(principal: Principal, key: string, membershipId: string) {
    const companyId = principal.companyId;
    const fingerprint = createHash('sha256').update(JSON.stringify(['team_resend_invitation', membershipId])).digest('hex');
    return this.prisma.transaction(async (tx) => {
      await this.requireManager(tx, principal);
      for (const id of [...new Set([principal.membershipId, membershipId])].sort())
        await tx.membership.updateMany({ where: { id, companyId }, data: { transitionVersion: { increment: 1 } } });
      const identity = { companyId, membershipId: principal.membershipId, key };
      const existing = await tx.operation.findUnique({ where: { companyId_membershipId_key: identity } });
      if (existing) {
        if (existing.fingerprint !== fingerprint) reject('idempotency_key_reused');
        return existing.response as { id: string; invitationStatus: 'pending' | 'accepted' | 'expired'; deliveryStatus: 'pending' };
      }
      const response = await this.invitations.issue(tx, companyId, membershipId, principal.userId);
      await tx.operation.create({ data: { ...identity, fingerprint, response } });
      await tx.auditEntry.create({ data: { companyId, membershipId: principal.membershipId, action: 'team_resend_invitation', subjectId: membershipId } });
      return response;
    }).then((response) => { this.mail.kick(); return response; });
  }

  history(principal: Principal, membershipId: string, query: PaginationQuery) {
    return this.prisma.transaction(async tx => {
      await this.requireManager(tx, principal);
      const protectedMember = await tx.membership.findFirst({ where: { companyId: principal.companyId, id: membershipId, user: { isPlatformOwner: true } }, select: { id: true } });
      if (protectedMember) reject('team_forbidden');
      return this.invitations.history(tx, principal.companyId, membershipId, query);
    });
  }
}
