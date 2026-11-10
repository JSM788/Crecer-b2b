import { z } from 'zod';
import { paginationQuerySchema } from '../../../common/pagination';

export const customerFiltersSchema = paginationQuerySchema.extend({
  district: z.string().trim().max(100).optional(),
  zone: z.string().trim().max(100).optional(),
  membershipId: z.uuid().optional(),
  role: z.enum(['commercial', 'merchandiser']).optional(),
  assignment: z.enum(['assigned', 'unassigned']).optional(),
}).strict();
export type CustomerFilters = z.infer<typeof customerFiltersSchema>;

export const createCustomerSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    address: z.string().trim().min(1).max(300),
    ruc: z.string().regex(/^[0-9]{11}$/),
    district: z.string().trim().min(1).max(100),
    zone: z.string().trim().max(100).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
    commercialMembershipId: z.uuid().optional(),
    merchandiserMembershipId: z.uuid().optional(),
  })
  .strict();
export const importCustomerItemSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    address: z.string().trim().min(1).max(300),
    ruc: z.string().regex(/^[0-9]{11}$/),
    district: z.string().trim().min(1).max(100),
    zone: z.string().trim().max(100).optional(),
    latitude: z.number().min(-90).max(90).nullable().optional(),
    longitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .strict();
export const importCustomersSchema = z
  .object({
    items: z.array(importCustomerItemSchema).min(1).max(500),
  })
  .strict();
export const importCustomersResponseSchema = z.object({
  imported: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
});
export const assignCustomersSchema = z
  .object({
    customerIds: z
      .array(z.uuid())
      .min(1)
      .max(200)
      .refine(
        (ids) => new Set(ids).size === ids.length,
        'Customer IDs must be unique',
      ),
    membershipId: z.uuid(),
  })
  .strict();
export const customerResponseSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  address: z.string(),
});
export const assigneeResponseSchema = z.object({
  displayName: z.string().nullable().optional(),
  id: z.uuid(),
  email: z.email(),
  role: z.enum(['commercial', 'merchandiser']),
});
export const managedCustomerResponseSchema = customerResponseSchema.extend({
  ruc: z.string().nullable(),
  district: z.string().nullable(),
  zone: z.string().nullable(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  condition: z.null(),
  lastPurchaseDate: z.null(),
  assignments: z.array(
    z.object({
      membershipId: z.uuid(),
      displayName: z.string().nullable().optional(),
      email: z.email(),
      role: z.enum(['commercial', 'merchandiser']),
    }),
  ),
});
export type CreateCustomerDto = z.infer<typeof createCustomerSchema>;
export type ImportCustomersDto = z.infer<typeof importCustomersSchema>;
export type AssignCustomersDto = z.infer<typeof assignCustomersSchema>;
