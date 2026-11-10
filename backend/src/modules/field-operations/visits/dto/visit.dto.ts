import { z } from 'zod';
import type { Visit } from '../../../../generated/prisma/client';

export const idSchema = z.uuid();
export const scheduleSchema = z
  .object({
    customerId: idSchema,
    scheduledAt: z.iso.datetime({ offset: true }),
  })
  .strict();
export const evidenceSchema = z
  .object({
    mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    base64: z.string().min(1).max(1398104),
  })
  .strict();
const attachmentSchema = evidenceSchema.superRefine((evidence, context) => {
  const invalid = () =>
    context.addIssue({
      code: 'custom',
      message:
        'Evidence must be a canonical image of at most 1 MiB matching its MIME type.',
    });
  if (
    evidence.base64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(evidence.base64)
  )
    return invalid();
  const bytes = Buffer.from(evidence.base64, 'base64');
  if (
    bytes.length < 1 ||
    bytes.length > 1048576 ||
    bytes.toString('base64') !== evidence.base64
  )
    return invalid();
  const png = bytes
    .subarray(0, 8)
    .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  const jpeg =
    bytes.length >= 4 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255;
  const webp =
    bytes.length >= 12 &&
    bytes.toString('ascii', 0, 4) === 'RIFF' &&
    bytes.toString('ascii', 8, 12) === 'WEBP';
  if (
    !(evidence.mimeType === 'image/png'
      ? png
      : evidence.mimeType === 'image/jpeg'
        ? jpeg
        : webp)
  )
    invalid();
});
export const exhibitionAuditSchema = z
  .object({
    hasShelfStock: z.boolean(),
    noStockReason: z.string().trim().min(1).max(1000).optional(),
    brandDisplay: z.enum(['adequate', 'inadequate']),
    pricesVisible: z.boolean(),
  })
  .strict()
  .superRefine((audit, context) => {
    if (!audit.hasShelfStock && !audit.noStockReason) {
      context.addIssue({
        code: 'custom',
        path: ['noStockReason'],
        message: 'A reason is required when shelf stock is unavailable.',
      });
    }
    if (audit.hasShelfStock && audit.noStockReason) {
      context.addIssue({
        code: 'custom',
        path: ['noStockReason'],
        message:
          'A stock shortage reason does not apply when shelf stock is available.',
      });
    }
  });
export const closeSchema = z
  .object({
    result: z.enum(['attended', 'closed', 'unavailable']),
    observations: z.string().trim().max(4000),
    attachment: attachmentSchema.optional(),
    audit: exhibitionAuditSchema.optional(),
  })
  .strict();
const timestamp = z.iso.datetime({ offset: true });
export const visitResponseSchema = z.object({
  id: idSchema,
  company_id: idSchema,
  membership_id: idSchema,
  customer_id: idSchema,
  scheduled_at: timestamp,
  workday_id: idSchema.nullable(),
  status: z.enum(['pending', 'active', 'completed', 'cancelled']),
  version: z.number().int().nonnegative(),
  stop_order: z.number().int().nullable().optional(),
  planned_role: z.enum(['commercial', 'merchandiser']).nullable(),
  execution_role: z.enum(['commercial', 'merchandiser']).nullable(),
  cancelled_at: timestamp.nullable(),
  cancellation_reason: z.string().nullable(),
  arrived_at: timestamp.nullable(),
  ended_at: timestamp.nullable(),
  result: z.enum(['attended', 'closed', 'unavailable']).nullable(),
  observations: z.string().nullable(),
  audit: exhibitionAuditSchema.nullable().optional(),
});
export const agendaResponseSchema = z.array(
  visitResponseSchema.extend({
    customer_name: z.string(),
    customer_address: z.string(),
    customer_ruc: z.string().nullable().optional(),
    customer_district: z.string().nullable().optional(),
    customer_latitude: z.number().nullable().optional(),
    customer_longitude: z.number().nullable().optional(),
    has_evidence: z.boolean(),
  }),
);
export type ScheduleVisitDto = z.infer<typeof scheduleSchema>;
export type CloseVisitDto = z.infer<typeof closeSchema>;

export function visitResponse(visit: Visit) {
  return visitResponseSchema.parse({
    id: visit.id,
    company_id: visit.companyId,
    membership_id: visit.membershipId,
    customer_id: visit.customerId,
    scheduled_at: visit.scheduledAt.toISOString(),
    workday_id: visit.workdayId,
    status: visit.status,
    version: visit.version,
    stop_order: visit.stopOrder ?? null,
    planned_role: visit.plannedRole,
    execution_role: visit.executionRole,
    cancelled_at: visit.cancelledAt?.toISOString() ?? null,
    cancellation_reason: visit.cancellationReason,
    arrived_at: visit.arrivedAt?.toISOString() ?? null,
    ended_at: visit.endedAt?.toISOString() ?? null,
    result: visit.result,
    observations: visit.observations,
    audit: visit.audit ?? null,
  });
}
