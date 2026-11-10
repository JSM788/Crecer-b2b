import { memberListQuerySchema, memberResponseSchema, memberInputSchema } from '../../platform/dto/platform.dto';
import { z } from 'zod';

export const teamQuerySchema = memberListQuerySchema;
export const teamProfileSchema = memberInputSchema.omit({ role: true }).extend({
  email: z.email().max(254).transform(value => value.toLowerCase()),
}).strict();
export type TeamProfileInput = z.infer<typeof teamProfileSchema>;

export const teamMemberResponseSchema = memberResponseSchema.omit({
  isPlatformOwner: true,
});
