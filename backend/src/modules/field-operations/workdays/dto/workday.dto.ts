import { z } from 'zod';
import type { Workday } from '../../../../generated/prisma/client';

const timestamp = z.iso.datetime({ offset: true });
export const workdayResponseSchema = z.object({
  id: z.uuid(),
  company_id: z.uuid(),
  membership_id: z.uuid(),
  business_date: z.iso.date(),
  status: z.enum(['active', 'completed']),
  role: z.enum(['commercial', 'merchandiser']).nullable(),
  started_at: timestamp,
  ended_at: timestamp.nullable(),
  completed_visits: z.number().int().nonnegative(),
  total_visits: z.number().int().nonnegative(),
});
export const endWorkdaySchema = z
  .object({
    justification: z.string().max(1000).optional(),
  })
  .strict();
export type EndWorkdayDto = z.infer<typeof endWorkdaySchema>;

export function workdayResponse(day: Workday, statistics: { completed_visits: number; total_visits: number }) {
  return workdayResponseSchema.parse({
    id: day.id,
    company_id: day.companyId,
    membership_id: day.membershipId,
    business_date: day.businessDate.toISOString().slice(0, 10),
    status: day.status,
    role: day.role,
    started_at: day.startedAt.toISOString(),
    ended_at: day.endedAt?.toISOString() ?? null,
    ...statistics,
  });
}
