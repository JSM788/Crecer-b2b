import { z } from 'zod';

export const credentialsSchema = z.object({
  email: z.email().max(254).transform(value => value.toLowerCase()),
  password: z.string().min(1).max(128),
}).strict();

export const loginSchema = credentialsSchema.extend({company:z.string().regex(/^[a-z0-9-]{1,64}$/)});

export const companyNameSchema = z.string().trim().min(1).max(150);
