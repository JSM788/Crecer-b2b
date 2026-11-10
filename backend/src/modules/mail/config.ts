import { z } from 'zod';
const boolean = z.enum(['true', 'false']).transform((value) => value === 'true');
const schema = z.object({
  MAIL_ENABLED: boolean.default(false),
  SMTP_HOST: z.string().min(1).optional(),
  SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
  SMTP_SECURE: boolean.default(false),
  SMTP_REQUIRE_TLS: boolean.default(true),
  SMTP_USER: z.string().min(1).optional(),
  SMTP_PASSWORD: z.string().min(1).optional(),
  SMTP_FROM: z.email().optional(),
  WEB_PUBLIC_URL: z.url().optional(),
  MOBILE_APP_SCHEME: z.string().regex(/^[a-z][a-z0-9+.-]*$/).default('aquamundo-demo'),
  MAIL_ENCRYPTION_KEY: z.string().optional(),
  INVITATION_TTL_HOURS: z.coerce.number().int().min(1).max(168).default(48),
  MAIL_WORKER_INTERVAL_MS: z.coerce.number().int().min(1000).max(60000).default(15000),
  MAIL_MAX_ATTEMPTS: z.coerce.number().int().min(1).max(10).default(5),
}).superRefine((value, context) => {
  if (!value.MAIL_ENABLED) return;
  for (const key of ['SMTP_HOST', 'SMTP_FROM', 'WEB_PUBLIC_URL', 'MAIL_ENCRYPTION_KEY'] as const) {
    if (!value[key]) context.addIssue({ code: 'custom', path: [key], message: 'Required when mail is enabled' });
  }
  if (Boolean(value.SMTP_USER) !== Boolean(value.SMTP_PASSWORD))
    context.addIssue({ code: 'custom', path: ['SMTP_USER'], message: 'SMTP username and password must be configured together' });
  if (!value.SMTP_SECURE && !value.SMTP_REQUIRE_TLS && !['localhost', '127.0.0.1', '::1'].includes(value.SMTP_HOST ?? ''))
    context.addIssue({ code: 'custom', path: ['SMTP_REQUIRE_TLS'], message: 'Require TLS for non-local SMTP servers' });
  if (value.MAIL_ENCRYPTION_KEY && (!/^[A-Za-z0-9+/]{43}=$/.test(value.MAIL_ENCRYPTION_KEY) || Buffer.from(value.MAIL_ENCRYPTION_KEY, 'base64').length !== 32))
    context.addIssue({ code: 'custom', path: ['MAIL_ENCRYPTION_KEY'], message: 'Use a base64 encoded 32-byte key' });
  if (value.WEB_PUBLIC_URL) {
    const url = new URL(value.WEB_PUBLIC_URL);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || url.search || url.hash)
      context.addIssue({ code: 'custom', path: ['WEB_PUBLIC_URL'], message: 'Use an HTTP(S) application URL without credentials, query or fragment' });
    if (url.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
      context.addIssue({ code: 'custom', path: ['WEB_PUBLIC_URL'], message: 'Use HTTPS outside localhost' });
  }
});
export function loadMailConfig(env: NodeJS.ProcessEnv = process.env) { return schema.parse(env); }
export type MailConfig = ReturnType<typeof loadMailConfig>;
