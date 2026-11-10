import { z } from 'zod';

export const credentialsSchema = z
  .object({
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
    password: z.string().min(4).max(128),
  })
  .strict();
export type LoginDto = z.infer<typeof credentialsSchema>;
export const loginResponseSchema = z.object({
  token: z.string(),
  expiresAt: z.iso.datetime({ offset: true }),
});
export const emptyBodySchema = z.object({}).strict();
const tenantSessionResponseSchema = z.object({
  scope: z.literal('tenant'),
  companyId: z.uuid(),
  membershipId: z.uuid(),
  userId: z.uuid(),
  role: z.enum(['commercial', 'merchandiser', 'manager']),
  email: z.email(),
  timeZone: z.string(),
  permissions: z.array(
    z.enum(['manage_customers', 'manage_field_operations']),
  ),
});
export const sessionResponseSchema = z.union([
  tenantSessionResponseSchema,
  z.object({
    scope: z.literal('platform'),
    companyId: z.null(),
    membershipId: z.null(),
    userId: z.uuid(),
    role: z.literal('platform_owner'),
    email: z.email(),
    timeZone: z.null(),
    permissions: z.tuple([z.literal('manage_platform')]),
  }),
]);
