import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { PrismaService } from './database/prisma.service';
import { ApiExceptionFilter } from './common/filters/api-exception.filter';
import { requestContext } from './common/http/request-context.middleware';
import { loadTenantDomains, TenantDomain } from './config/tenant-domains';

/** Compose transport only. Business rules live in their feature use cases. */
export async function createApp(
  prisma: PrismaService,
  logging = true,
  origins: string[] = [],
  tenantDomains: TenantDomain[] = loadTenantDomains(process.env.TENANT_DOMAINS),
) {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule.register(prisma, tenantDomains),
    { logger: false, abortOnError: false },
  );
  app.use(requestContext(logging));
  app.useBodyParser('json', { limit: '1450kb' });
  app.useGlobalFilters(new ApiExceptionFilter());
  if (origins.length > 0) {
    app.enableCors({
      origin: origins,
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'Idempotency-Key',
        'X-Tenant-Host',
      ],
      exposedHeaders: ['X-Request-Id'],
    });
  }
  return app;
}
