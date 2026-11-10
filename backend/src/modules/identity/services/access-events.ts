import type { Transaction } from '../../../database/prisma.service';
import type { Prisma } from '../../../generated/prisma/client';

export type AccessEventInput = {
  userId?: string;
  companyId?: string;
  membershipId?: string;
  invitationId?: string;
  actorUserId?: string;
  event: string;
  outcome?: string;
  details?: Prisma.InputJsonObject;
};

/** Store only business facts, never submitted credentials or usable links. */
export function recordAccessEvent(tx: Transaction, event: AccessEventInput) {
  return tx.accessEvent.create({ data: event });
}

/** User history omits processing steps; all original events remain in the audit store. */
export const userAccessHistoryFilter = {
  event: {
    notIn: [
      'invitation_issued',
      'invitation_reissued',
      'invitation_inspected',
      'invitation_opened',
      'mail_attempt',
      'mail_attempted',
    ],
  },
} satisfies Prisma.AccessEventWhereInput;
