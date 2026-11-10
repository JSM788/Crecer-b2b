import { Injectable } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { PrismaService, Transaction } from '../../../database/prisma.service';
import { Prisma } from '../../../generated/prisma/client';
import { reject } from '../../../common/errors/application-error';
import { Principal, Permission } from '../../../common/types/principal';

type FieldAction =
  | 'start_workday'
  | 'end_workday'
  | 'schedule_visit'
  | 'schedule_team_visit'
  | 'reschedule_team_visit'
  | 'cancel_team_visit'
  | 'sync_weekly_routes'
  | 'check_in'
  | 'close_visit';

@Injectable()
export class FieldCommandsService {
  constructor(private readonly prisma: PrismaService) {}

  async execute<T extends { id: string }>(
    principal: Principal,
    key: string,
    action: FieldAction,
    input: unknown,
    run: (tx: Transaction, context: { recordDetails: (details: Prisma.InputJsonObject) => void }) => Promise<T>,
    options: {
      requiredPermission?: Permission;
      targetMembershipId?: string;
    } = {},
  ): Promise<T> {
    const fingerprint = createHash('sha256')
      .update(JSON.stringify([action, input]))
      .digest('hex');
    return this.prisma.transaction(async (tx) => {
      const session = await tx.session.findFirst({
        where: {
          tokenHash: principal.tokenHash,
          companyId: principal.companyId,
          membershipId: principal.membershipId,
          expiresAt: { gt: new Date() },
          membership: { active: true },
        },
        include: {
          membership: {
            include: { user: { select: { isPlatformOwner: true } } },
          },
        },
      });
      if (!session) reject('authentication_required');
      if (
        (options.requiredPermission === 'manage_field_operations' &&
          !session.membership.canManageFieldOperations &&
          !session.membership.user.isPlatformOwner) ||
        (options.requiredPermission === 'manage_customers' &&
          !session.membership.canManageCustomers &&
          !session.membership.user.isPlatformOwner)
      )
        reject('field_management_forbidden');
      if (!options.requiredPermission && session.membership.role === 'manager')
        reject('field_role_required');
      const identity = {
        companyId: principal.companyId,
        membershipId: principal.membershipId,
        key,
      };
      const receipt = await tx.operation.findUnique({
        where: { companyId_membershipId_key: identity },
      });
      if (receipt) {
        if (receipt.fingerprint !== fingerprint)
          reject('idempotency_key_reused');
        return receipt.response as T;
      }
      // The atomic increment takes PostgreSQL's row lock through an ORM operation.
      // Lock involved memberships in a stable order: actor receipts remain owned by the actor.
      const ids = [
        ...new Set([
          principal.membershipId,
          ...(options.targetMembershipId ? [options.targetMembershipId] : []),
        ]),
      ].sort();
      for (const id of ids) {
        const actor = id === principal.membershipId;
        const member = await tx.membership.updateMany({
          where: {
            companyId: principal.companyId,
            id,
            active: true,
            ...(actor &&
            options.requiredPermission === 'manage_field_operations'
              ? {
                  OR: [
                    { canManageFieldOperations: true },
                    { user: { isPlatformOwner: true } },
                  ],
                }
              : {}),
            ...(actor && options.requiredPermission === 'manage_customers'
              ? {
                  OR: [
                    { canManageCustomers: true },
                    { user: { isPlatformOwner: true } },
                  ],
                }
              : {}),
            ...(id === options.targetMembershipId
              ? { role: { in: ['commercial', 'merchandiser'] } }
              : {}),
          },
          data: { transitionVersion: { increment: 1 } },
        });
        if (member.count !== 1) {
          if (!actor) reject('field_member_not_found');
          if (options.requiredPermission) reject('field_management_forbidden');
          reject('authentication_required');
        }
      }
      let details: Prisma.InputJsonObject | undefined;
      const result = await run(tx, { recordDetails: (value) => { details = value; } });
      const response = JSON.parse(
        JSON.stringify(result),
      ) as Prisma.InputJsonObject;
      await tx.operation.create({
        data: { ...identity, fingerprint, response },
      });
      await tx.auditEntry.create({
        data: {
          companyId: principal.companyId,
          membershipId: principal.membershipId,
          action,
          subjectId: result.id,
          ...(details ? { details } : {}),
        },
      });
      return response as T;
    });
  }
}
