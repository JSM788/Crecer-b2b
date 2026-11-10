import { z } from 'zod';
import { paginationQuerySchema, pageResultSchema } from '../../../../common/pagination';
import {
  agendaResponseSchema,
  scheduleSchema,
} from '../../visits/dto/visit.dto';
import { workdayResponseSchema } from '../../workdays/dto/workday.dto';

export const fieldRoleSchema = z.enum(['commercial', 'merchandiser']);
export const fieldMemberSchema = z.object({
  displayName: z.string().nullable().optional(),
  id: z.uuid(),
  email: z.email(),
  role: fieldRoleSchema,
});
export const fieldCustomersSchema = z.array(
  z.object({ id: z.uuid(), name: z.string(), address: z.string() }),
);
export const fieldFiltersSchema = paginationQuerySchema.extend({
    membershipId: z.uuid().optional(),
    role: fieldRoleSchema.optional(),
    date: z.iso.date().optional(),
    dateFrom: z.iso.date().optional(),
    dateTo: z.iso.date().optional(),
    workdayDate: z.iso.date().optional(),
    status: z.enum(['pending', 'active', 'completed', 'cancelled']).optional(),
  })
  .strict();
export const syncWeeklyRoutesSchema = z
  .object({
    membershipId: z.uuid(),
    days: z
      .array(
        z
          .object({
            date: z.iso.date(),
            customerIds: z.array(z.uuid()).max(6),
          })
          .strict(),
      )
      .min(1)
      .max(7),
  })
  .strict();
export const syncWeeklyRoutesResponseSchema = z.object({
  scheduled: z.number().int().nonnegative(),
});
export type SyncWeeklyRoutesDto = z.infer<typeof syncWeeklyRoutesSchema>;
export const teamScheduleSchema = scheduleSchema
  .extend({ membershipId: z.uuid() })
  .strict();
const memberIdentity = {
  member_email: z.email(),
  member_role: fieldRoleSchema.nullable(),
};
export const teamAgendaSchema = z.array(
  agendaResponseSchema.element.extend(memberIdentity),
);
export const teamWorkdaysSchema = z.array(
  workdayResponseSchema.extend({ ...memberIdentity,
    completed_visits: z.number().int().nonnegative(),
    total_visits: z.number().int().nonnegative(),
  }),
);
export type FieldFilters = z.infer<typeof fieldFiltersSchema>;
export type TeamSchedule = z.infer<typeof teamScheduleSchema>;
export const rescheduleVisitSchema = z.object({
  scheduledAt: z.iso.datetime({ offset: true }),
  expectedVersion: z.number().int().nonnegative(),
}).strict();
export const cancelVisitSchema = z.object({
  expectedVersion: z.number().int().nonnegative(),
  reason: z.string().trim().min(1).max(1000).optional(),
}).strict();
export type RescheduleVisit = z.infer<typeof rescheduleVisitSchema>;
export type CancelVisit = z.infer<typeof cancelVisitSchema>;
export const fieldMembersPageSchema = pageResultSchema(fieldMemberSchema);
export const fieldCustomersPageSchema = pageResultSchema(fieldCustomersSchema.element);
export const teamAgendaPageSchema = pageResultSchema(teamAgendaSchema.element);
export const teamWorkdaysPageSchema = pageResultSchema(teamWorkdaysSchema.element);
