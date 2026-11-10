import { Transaction } from '../../../database/prisma.service';
import { recordAccessEvent } from './access-events';

export async function revokeAccessLinks(tx: Transaction, userId: string, actorUserId: string, outcome: 'email_changed' | 'password_changed') {
  const links = await tx.invitation.findMany({
    where: { membership: { userId }, consumedAt: null, revokedAt: null },
    select: { id: true, companyId: true, membershipId: true },
  });
  await tx.invitation.updateMany({ where: { membership: { userId }, consumedAt: null, revokedAt: null }, data: { revokedAt: new Date(), tokenCiphertext: null } });
  await tx.mailOutbox.updateMany({ where: { invitation: { membership: { userId } }, status: { in: ['pending', 'sending', 'failed'] } }, data: { status: 'cancelled', lockedUntil: null, claimToken: null } });
  for (const link of links) await recordAccessEvent(tx, {
    userId, companyId: link.companyId, membershipId: link.membershipId,
    invitationId: link.id, actorUserId, event: 'invitation_revoked', outcome,
  });
}
