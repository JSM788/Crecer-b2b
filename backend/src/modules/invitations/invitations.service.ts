import { Injectable } from '@nestjs/common';
import { PrismaService, Transaction } from '../../database/prisma.service';
import { reject, type ErrorCode } from '../../common/errors/application-error';
import { TenantResolver } from '../../common/guards/tenant-routing.module';
import { CredentialsService } from '../identity/services/credentials.service';
import { recordAccessEvent, userAccessHistoryFilter } from '../identity/services/access-events';
import { pageResult, type PaginationQuery } from '../../common/pagination';
import { loadMailConfig } from '../mail/config';
import { encryptInvitationToken } from '../mail/token-cipher';
import { invitationInfoSchema, acceptedInvitationSchema } from './invitation.dto';

@Injectable()
export class InvitationsService {
  private readonly config = loadMailConfig();
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentials: CredentialsService,
    private readonly tenants: TenantResolver,
  ) {}

  async issue(tx: Transaction, companyId: string, membershipId: string, createdByUserId: string) {
    if (!this.config.MAIL_ENABLED) reject('mail_not_configured');
    const member = await tx.membership.findFirst({
      where: { id: membershipId, companyId, active: true, company: { status: 'active' } },
      include: { user: true, company: { include: { domains: true } } },
    });
    if (!member) reject('invitation_unavailable');
    if (member.user.isPlatformOwner) reject('platform_owner_protected');
    await tx.user.update({ where: { id: member.userId }, data: { platformVersion: { increment: 1 } } });
    this.companyHost(member.company);
    const purpose = member.user.passwordHash === null && member.user.activatedAt === null ? 'activation' : 'password_reset';
    const previous = await tx.invitation.count({ where: { companyId, membershipId } });
    const now = new Date();
    await tx.invitation.updateMany({
      where: { membership: { userId: member.userId }, consumedAt: null, revokedAt: null },
      data: { revokedAt: now, tokenCiphertext: null },
    });
    await tx.mailOutbox.updateMany({
      where: { invitation: { membership: { userId: member.userId } }, status: { in: ['pending', 'sending', 'failed'] } },
      data: { status: 'cancelled', lockedUntil: null, claimToken: null },
    });
    const token = this.credentials.generateToken();
    const invitation = await tx.invitation.create({
      data: {
        companyId, membershipId, createdByUserId, purpose,
        tokenHash: this.credentials.digestToken(token),
        tokenCiphertext: encryptInvitationToken(token, this.config.MAIL_ENCRYPTION_KEY!),
        expiresAt: new Date(now.getTime() + this.config.INVITATION_TTL_HOURS * 3600000),
        outbox: { create: { nextAttemptAt: now } },
      },
    });
    await recordAccessEvent(tx, { userId: member.userId, companyId, membershipId, invitationId: invitation.id, actorUserId: createdByUserId,
      event: previous ? 'invitation_reissued' : 'invitation_issued', outcome: 'queued', details: { purpose, expiresAt: invitation.expiresAt.toISOString() } });
    return { id: membershipId, invitationStatus: purpose === 'activation' ? 'pending' as const : 'accepted' as const, deliveryStatus: 'pending' as const };
  }

  private companyHost(company: { slug: string; domains: { hostname: string }[] }): string {
    const hostname = company.domains.map((domain) => domain.hostname).sort()[0]
      ?? this.tenants.configured().find((domain) => domain.company === company.slug)?.host;
    if (!hostname) reject('invitation_unavailable');
    return hostname;
  }

  private async readLink(tx: Transaction, token: string) {
    const invitation = await tx.invitation.findUnique({
      where: { tokenHash: this.credentials.digestToken(token) },
      include: { membership: { include: { user: true, company: { include: { domains: true } } } } },
    });
    let denial: ErrorCode | undefined;
    if (!invitation || invitation.revokedAt || invitation.consumedAt) denial = 'invitation_invalid';
    else if (invitation.expiresAt <= new Date()) denial = 'invitation_expired';
    else if (!invitation.membership.active || invitation.membership.company.status !== 'active' || invitation.membership.user.isPlatformOwner
      || (invitation.purpose === 'activation' && (invitation.membership.user.passwordHash !== null || invitation.membership.user.activatedAt !== null))
      || (invitation.purpose === 'password_reset' && invitation.membership.user.passwordHash === null)) denial = 'invitation_unavailable';
    return { invitation, denial };
  }

  private async auditLink(tx: Transaction, link: Awaited<ReturnType<InvitationsService['readLink']>>, event: string, outcome: string) {
    const invitation = link.invitation;
    if (!invitation) return;
    await recordAccessEvent(tx, { userId: invitation.membership.userId, companyId: invitation.companyId,
      membershipId: invitation.membershipId, invitationId: invitation.id, event, outcome,
      details: { purpose: invitation.purpose, expiresAt: invitation.expiresAt.toISOString() } });
  }

  async inspect(token: string) {
    const result = await this.prisma.transaction(async (tx) => {
      const link = await this.readLink(tx, token);
      await this.auditLink(tx, link, link.denial ? 'invitation_rejected' : 'invitation_opened', link.denial ?? 'accepted');
      if (link.denial || !link.invitation) return { denial: link.denial ?? 'invitation_invalid' as const };
      const invitation = link.invitation;
      const member = invitation.membership;
      return { value: invitationInfoSchema.parse({
        companyId: invitation.companyId,
        companyName: member.company.name,
        tenantHost: this.companyHost(member.company),
        email: member.user.email,
        role: member.role,
        expiresAt: invitation.expiresAt.toISOString(),
        purpose: invitation.purpose,
      }) };
    });
    // Reject only after committing the observation, including expired/reused links.
    if ('denial' in result) reject(result.denial!);
    return result.value;
  }

  async accept(token: string, password: string) {
    // Reject invalid links before expensive password hashing; re-check inside the write transaction.
    await this.inspect(token);
    const passwordHash = await this.credentials.hashPassword(password);
    const result = await this.prisma.transaction(async (tx) => {
      const link = await this.readLink(tx, token);
      if (link.denial || !link.invitation) {
        await this.auditLink(tx, link, 'invitation_rejected', link.denial ?? 'invitation_invalid');
        return { denial: link.denial ?? 'invitation_invalid' as const };
      }
      const invitation = link.invitation;
      const member = invitation.membership;
      await tx.membership.update({ where: { id: member.id }, data: { transitionVersion: { increment: 1 } } });
      const now = new Date();
      const consumed = await tx.invitation.updateMany({
        where: { id: invitation.id, consumedAt: null, revokedAt: null, expiresAt: { gt: now } },
        data: { consumedAt: now, tokenCiphertext: null },
      });
      if (consumed.count !== 1) {
        await this.auditLink(tx, link, 'invitation_rejected', 'invitation_invalid');
        return { denial: 'invitation_invalid' as const };
      }
      await tx.user.update({ where: { id: member.userId }, data: { passwordHash, failures: 0, blockedUntil: null,
        passwordChangedAt: now, ...(invitation.purpose === 'activation' ? { activatedAt: now } : {}) } });
      await tx.session.deleteMany({ where: { membership: { userId: member.userId } } });
      await tx.platformSession.deleteMany({ where: { userId: member.userId } });
      await tx.invitation.updateMany({ where: { membership: { userId: member.userId }, id: { not: invitation.id }, consumedAt: null, revokedAt: null },
        data: { revokedAt: now, tokenCiphertext: null } });
      await tx.mailOutbox.updateMany({
        where: { invitation: { membership: { userId: member.userId } }, status: { in: ['pending', 'sending', 'failed'] } },
        data: { status: 'cancelled', lockedUntil: null, claimToken: null },
      });
      await recordAccessEvent(tx, { userId: member.userId, companyId: invitation.companyId, membershipId: member.id, invitationId: invitation.id,
        event: invitation.purpose === 'activation' ? 'account_activated' : 'password_reset_completed', outcome: 'completed', details: { purpose: invitation.purpose } });
      return { value: acceptedInvitationSchema.parse({ companyId: invitation.companyId, tenantHost: this.companyHost(member.company), email: member.user.email, purpose: invitation.purpose }) };
    });
    if ('denial' in result) reject(result.denial!);
    return result.value;
  }

  async history(tx: Transaction, companyId: string, membershipId: string, query: PaginationQuery) {
    const member = await tx.membership.findFirst({ where: { companyId, id: membershipId }, select: { userId: true } });
    if (!member) reject('platform_member_not_found');
    const where = { ...userAccessHistoryFilter, OR: [{ companyId, membershipId }, { userId: member.userId, companyId: null }] };
    const total = await tx.accessEvent.count({ where });
    const events = await tx.accessEvent.findMany({ where, orderBy: [{ occurredAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      select: { id: true, event: true, outcome: true, occurredAt: true, actorUserId: true, details: true,
        invitation: { select: { purpose: true, expiresAt: true } } } });
    return pageResult(events.map(({ invitation, ...event }) => {
      const details = event.details && typeof event.details === 'object' && !Array.isArray(event.details)
        ? event.details : {};
      return { ...event, occurredAt: event.occurredAt.toISOString(),
        details: invitation ? { ...details, purpose: invitation.purpose, expiresAt: invitation.expiresAt.toISOString() } : event.details };
    }), total, query);
  }
}
