import { Prisma } from '../../../generated/prisma/client';
import { memberResponseSchema } from '../dto/platform.dto';

export const memberUserSelection = {
  email: true,
  displayName: true,
  phone: true,
  isPlatformOwner: true,
  passwordHash: true,
  activatedAt: true,
  passwordChangedAt: true,
} as const;
type MembershipWithUser = Prisma.MembershipGetPayload<{
  include: { user: { select: typeof memberUserSelection } };
}>;

export const memberInvitationSelection = { orderBy: [{ createdAt: 'desc' as const }, { id: 'desc' as const }], take: 1, include: { outbox: true } } satisfies Prisma.Membership$invitationsArgs;

type InvitationSummary = { purpose: string; expiresAt: Date; consumedAt: Date | null; revokedAt: Date | null; outbox: { status: string } | null };
export function memberInvitationResponse(member: { user: { passwordHash: string | null; activatedAt: Date | null; passwordChangedAt: Date | null }; invitations?: InvitationSummary[] }) {
  const invitation = member.invitations?.[0];
  const invitationStatus = member.user.activatedAt !== null || member.user.passwordHash !== null ? 'accepted' : (!invitation || invitation.revokedAt || invitation.expiresAt <= new Date() ? 'expired' : 'pending');
  const status = invitation?.outbox?.status;
  const deliveryStatus = !invitation || invitation.consumedAt ? null : status === 'sent' ? 'sent' : status === 'failed' || status === 'cancelled' ? 'failed' : 'pending';
  return { invitationStatus, deliveryStatus, activatedAt: member.user.activatedAt?.toISOString() ?? null,
    passwordChangedAt: member.user.passwordChangedAt?.toISOString() ?? null };
}

export function memberResponse(member: MembershipWithUser & { invitations?: InvitationSummary[] }) {
  return memberResponseSchema.parse({
    id: member.id,
    userId: member.userId,
    companyId: member.companyId,
    displayName: member.user.displayName,
    phone: member.user.phone,
    email: member.user.email,
    role: member.role,
    active: member.active,
    isPlatformOwner: member.user.isPlatformOwner,
    ...memberInvitationResponse(member),
  });
}
