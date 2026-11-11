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
