import { z } from "zod";
import { phoneSchema } from '../../../common/phone';
import { paginationQuerySchema } from "../../../common/pagination";

export const platformIdSchema = z.uuid();
export const membershipRoleSchema = z.enum([
  "commercial",
  "merchandiser",
  "manager",
]);
const displayName = z.string().trim().min(1).max(150);
export const companyInputSchema = z
  .object({
    name: displayName,
    manager: z.object({ displayName, phone: phoneSchema, email: z.email().max(254).transform((value) => value.toLowerCase()) }).strict(),
    timeZone: z
      .string()
      .min(1)
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, "Use a supported IANA time zone."),
    hostname: z
      .string()
      .trim()
      .toLowerCase()
      .max(253)
      .regex(
        /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|127\.0\.0\.1)$/,
      ),
  })
  .strict();
export const memberInputSchema = z
  .object({
    displayName,
    phone: phoneSchema,
    email: z.email().max(254),
    role: membershipRoleSchema,
  })
  .strict();
export const memberStatusSchema = z.object({ active: z.boolean() }).strict();
export const editMemberSchema = memberInputSchema
  .extend({
    password: z.string().min(1).max(128).optional(),
    email: z
      .email()
      .max(254)
      .transform((value) => value.toLowerCase()),
  })
  .strict();
export const companyStatusSchema = z
  .object({ status: z.enum(["active", "suspended"]) })
  .strict();
export const editCompanySchema = z
  .object({
    name: displayName,
    timeZone: z
      .string()
      .min(1)
      .max(100)
      .refine((value) => {
        try {
          new Intl.DateTimeFormat("en", { timeZone: value });
          return true;
        } catch {
          return false;
        }
      }, "Use a supported IANA time zone."),
    hostname: z
      .string()
      .trim()
      .toLowerCase()
      .max(253)
      .regex(
        /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|127\.0\.0\.1)$/,
      )
      .optional(),
    manager: z
      .object({
        displayName,
        email: z
          .email()
          .max(254)
          .transform((value) => value.toLowerCase()),
        phone: phoneSchema,
      })
      .strict()
      .optional(),
  })
  .strict();
export type CompanyEditInput = z.infer<typeof editCompanySchema>;
export const companyManagerSummarySchema = z.object({
  id: platformIdSchema,
  userId: platformIdSchema,
  displayName: z.string().nullable(),
  email: z.email(),
  phone: z.string().nullable(),
});
export const companyResponseSchema = z.object({
  id: platformIdSchema,
  name: z.string(),
  slug: z.string(),
  status: z.enum(["active", "suspended"]),
  suspendedAt: z.iso.datetime({ offset: true }).nullable(),
  timeZone: z.string(),
  hostnames: z.array(z.string()),
  managerEmail: z.email().nullable(),
  manager: companyManagerSummarySchema.nullable().optional(),
  activeUserCount: z.number().int().nonnegative(),
  totalUserCount: z.number().int().nonnegative(),
});
export const memberResponseSchema = z.object({
  id: platformIdSchema,
  userId: platformIdSchema,
  companyId: platformIdSchema,
  displayName: z.string().nullable(),
  phone: z.string().nullable(),
  email: z.email(),
  role: membershipRoleSchema,
  active: z.boolean(),
  activatedAt: z.iso.datetime({offset:true}).nullable(),
  passwordChangedAt: z.iso.datetime({offset:true}).nullable(),
  isPlatformOwner: z.boolean(),
  invitationStatus: z.enum(["pending", "accepted", "expired"]),
  deliveryStatus: z.enum(["pending", "sent", "failed"]).nullable(),
});
export type CompanyInput = z.infer<typeof companyInputSchema>;
export type CompanyStatusInput = z.infer<typeof companyStatusSchema>;
export type MemberInput = z.infer<typeof memberInputSchema>;
export type MemberEditInput = z.infer<typeof editMemberSchema>;
export type CompanyResponse = z.infer<typeof companyResponseSchema>;
export type MemberResponse = z.infer<typeof memberResponseSchema>;

export const companyListQuerySchema = paginationQuerySchema.extend({ status: z.enum(["active", "suspended"]).optional() }).strict();
export const memberListQuerySchema = paginationQuerySchema.extend({ role: membershipRoleSchema.optional(), active: z.enum(["true", "false"]).transform((value) => value === "true").optional() }).strict();
export type CompanyListQuery = z.infer<typeof companyListQuerySchema>;
export type MemberListQuery = z.infer<typeof memberListQuerySchema>;

export const platformAuditEntryResponseSchema = z.object({
  id: platformIdSchema,
  action: z.string(),
  createdAt: z.iso.datetime({ offset: true }),
  actorUserId: platformIdSchema,
  actorEmail: z.string().nullable(),
  companyId: platformIdSchema,
  companyName: z.string().nullable(),
  subjectId: platformIdSchema,
});
export const platformAuditListQuerySchema = paginationQuerySchema.extend({
  companyId: platformIdSchema.optional(),
  action: z.string().optional(),
}).strict();
export type PlatformAuditListQuery = z.infer<typeof platformAuditListQuerySchema>;
export type PlatformAuditEntryResponse = z.infer<typeof platformAuditEntryResponseSchema>;

export const logSourceSchema = z.enum(["backend", "frontend", "mobile"]);
export const logLevelSchema = z.enum(["info", "warn", "error"]);

export const clientLogInputSchema = z.object({
  source: z.enum(["frontend", "mobile"]),
  level: logLevelSchema.default("info"),
  event: z.string().trim().min(1).max(120),
  message: z.string().trim().min(1).max(500),
  userId: z.string().trim().max(100).nullable().optional(),
  userEmail: z.string().trim().max(200).nullable().optional(),
  userName: z.string().trim().max(200).nullable().optional(),
  companyId: z.string().trim().max(100).nullable().optional(),
  companyName: z.string().trim().max(200).nullable().optional(),
  screen: z.string().trim().max(300).nullable().optional(),
  details: z.record(z.string(), z.unknown()).nullable().optional(),
}).strict();

export const clientLogResponseSchema = z.object({
  accepted: z.literal(true),
  id: z.string(),
});

export const platformLogEventSchema = z.object({
  id: z.string(),
  timestamp: z.iso.datetime({ offset: true }),
  source: logSourceSchema,
  level: logLevelSchema,
  event: z.string(),
  message: z.string(),
  userId: z.string().nullable(),
  userEmail: z.string().nullable(),
  userName: z.string().nullable(),
  companyId: z.string().nullable(),
  companyName: z.string().nullable(),
  screen: z.string().nullable(),
  details: z.record(z.string(), z.unknown()).nullable(),
});

export const platformLogEventsQuerySchema = paginationQuerySchema.extend({
  source: logSourceSchema.optional(),
  level: logLevelSchema.optional(),
  userId: z.string().trim().max(100).optional(),
  companyId: platformIdSchema.optional(),
  hours: z.coerce.number().int().min(1).max(720).optional(),
}).strict();

export const platformLogUserSummarySchema = z.object({
  userId: z.string(),
  email: z.string().nullable(),
  displayName: z.string().nullable(),
  companyId: z.string().nullable(),
  companyName: z.string().nullable(),
  totalEvents: z.number().int().nonnegative(),
  errorCount: z.number().int().nonnegative(),
  lastActivityAt: z.iso.datetime({ offset: true }),
});

export const platformLogUsersQuerySchema = z.object({
  companyId: platformIdSchema.optional(),
  search: z.string().trim().max(200).optional(),
  hours: z.coerce.number().int().min(1).max(720).optional(),
}).strict();

export const platformLogDaySummarySchema = z.object({
  date: z.string(),
  backend: z.number().int().nonnegative(),
  frontend: z.number().int().nonnegative(),
  mobile: z.number().int().nonnegative(),
  errors: z.number().int().nonnegative(),
});

export const platformLogsSummaryResponseSchema = z.object({
  totals: z.object({
    backend: z.number().int().nonnegative(),
    frontend: z.number().int().nonnegative(),
    mobile: z.number().int().nonnegative(),
    errors: z.number().int().nonnegative(),
    total: z.number().int().nonnegative(),
  }),
  byDay: z.array(platformLogDaySummarySchema),
  topUsers: z.array(platformLogUserSummarySchema),
});

export const platformLogFileSchema = z.object({
  source: logSourceSchema,
  filename: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  lastModified: z.iso.datetime({ offset: true }),
});

export const platformLogFilesQuerySchema = z.object({
  source: logSourceSchema.optional(),
}).strict();

export const platformLogFileContentSchema = z.object({
  source: logSourceSchema,
  filename: z.string(),
  sizeBytes: z.number().int().nonnegative(),
  content: z.string(),
});

export const platformLogFileNameSchema = z.string().regex(/^[A-Za-z0-9._-]+\.log$/);

export type ClientLogInput = z.infer<typeof clientLogInputSchema>;
export type PlatformLogEventsQuery = z.infer<typeof platformLogEventsQuerySchema>;
export type PlatformLogUsersQuery = z.infer<typeof platformLogUsersQuerySchema>;
export type PlatformLogFilesQuery = z.infer<typeof platformLogFilesQuerySchema>;
export type PlatformLogEvent = z.infer<typeof platformLogEventSchema>;
export type PlatformLogUserSummary = z.infer<typeof platformLogUserSummarySchema>;
