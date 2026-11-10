import { z } from 'zod';
export const invitationTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/);
export const acceptInvitationSchema = z.object({ password: z.string().min(4).max(128) }).strict();
export const invitationInfoSchema = z.object({
  companyId: z.uuid(), companyName: z.string(), tenantHost: z.string(), email: z.email(),
  role: z.enum(['commercial', 'merchandiser', 'manager']), expiresAt: z.iso.datetime({ offset: true }),
  purpose: z.enum(['activation', 'password_reset']),
});
export const acceptedInvitationSchema = invitationInfoSchema.pick({ companyId: true, tenantHost: true, email: true, purpose: true });
export const resendInvitationSchema = z.object({
  id: z.uuid(), invitationStatus: z.enum(['pending', 'accepted', 'expired']), deliveryStatus: z.literal('pending'),
});
export const emptyInvitationInput = z.object({}).strict();
export const accessEventSchema = z.object({
  id: z.uuid(), event: z.string(), outcome: z.string().nullable(), occurredAt: z.iso.datetime({offset:true}),
  actorUserId: z.uuid().nullable(), details: z.record(z.string(), z.unknown()).nullable(),
});
