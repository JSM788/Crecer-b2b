import { z } from 'zod';
import { loadTenantDomains } from './tenant-domains';
import { loadMailConfig } from '../modules/mail/config';

// 7 days in hours (7 * 24 = 168 hours)
export const DEFAULT_SESSION_TTL_HOURS = 168;

const policySchema = z.object({
  SESSION_TTL_HOURS: z.coerce.number().int().min(1).max(720).default(DEFAULT_SESSION_TTL_HOURS),
  LOGIN_MAX_FAILURES: z.coerce.number().int().min(3).max(20).default(5),
  LOGIN_LOCK_MINUTES: z.coerce.number().int().min(1).max(60).default(15),
  DB_POOL_SIZE: z.coerce.number().int().min(1).max(50).default(10),
  DB_STATEMENT_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(100)
    .max(60000)
    .default(10000),
  DB_TRANSACTION_ATTEMPTS: z.coerce.number().int().min(1).max(5).default(3),
});

export function loadPolicy(env: NodeJS.ProcessEnv = process.env) {
  return policySchema.parse(env);
}

const runtimeSchema = z.object({
  DATABASE_URL: z
    .url()
    .refine((value) =>
      ['postgres:', 'postgresql:'].includes(new URL(value).protocol),
    ),
  HOST: z.string().min(1).default('127.0.0.1'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3002),
  CORS_ORIGINS: z.string().optional(),
});

export function loadConfig(env: NodeJS.ProcessEnv = process.env) {
  loadPolicy(env);
  loadMailConfig(env);
  const config = runtimeSchema.parse(env);
  const origins =
    config.CORS_ORIGINS === undefined
      ? []
      : config.CORS_ORIGINS.split(',').map((value) => {
          const origin = z.url().parse(value.trim());
          const parsed = new URL(origin);
          if (
            !['https:', 'http:'].includes(parsed.protocol) ||
            parsed.origin !== origin
          ) {
            throw new Error('CORS_ORIGINS must contain exact HTTP origins');
          }
          return origin;
        });
  return {
    databaseUrl: config.DATABASE_URL,
    host: config.HOST,
    port: config.PORT,
    origins,
    tenantDomains: loadTenantDomains(env.TENANT_DOMAINS),
  };
}
