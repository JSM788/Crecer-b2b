import { z } from 'zod';

const hostname = z
  .string()
  .max(253)
  .regex(
    /^(?:localhost|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?|127\.0\.0\.1)$/,
  );
const domainsSchema = z
  .array(
    z
      .object({
        host: hostname,
        company: z.string().regex(/^[a-z0-9-]{1,64}$/),
      })
      .strict(),
  )
  .min(1)
  .superRefine((entries, context) => {
    if (new Set(entries.map((entry) => entry.host)).size !== entries.length) {
      context.addIssue({
        code: 'custom',
        message: 'Each tenant hostname must be unique',
      });
    }
  });

export type TenantDomain = z.infer<typeof domainsSchema>[number];

/** Exact lowercase hostnames only: no schemes, ports, wildcards or default company. */
export function loadTenantDomains(value: string | undefined): TenantDomain[] {
  if (!value) return [];
  try {
    return domainsSchema.parse(JSON.parse(value));
  } catch {
    return [];
  }
}
