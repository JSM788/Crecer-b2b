import { createApp } from './app';
import { PrismaService } from './database/prisma.service';
import { loadConfig } from './config/environment';
import { log, errorMetadata } from './common/logging';

async function main() {
  const config = loadConfig();
  const db = new PrismaService(config.databaseUrl);
  try {
    await db.$connect();
    await db.membership.findFirst({
      select: {
        canManageCustomers: true,
        canManageFieldOperations: true,
        transitionVersion: true,
      },
    });
    await db.visit.findFirst({ select: { audit: true } });
    await db.user.findFirst({
      select: { isPlatformOwner: true, displayName: true },
    });
    await db.companyDomain.findFirst({ select: { hostname: true } });
    const app = await createApp(db, true, config.origins, config.tenantDomains);
    const shutdown = async () => {
      await app.close();
    };
    process.once(
      'SIGTERM',
      () =>
        void shutdown().catch((error) => {
          log('error', 'shutdown_failed', errorMetadata(error));
          process.exitCode = 1;
        }),
    );
    process.once(
      'SIGINT',
      () =>
        void shutdown().catch((error) => {
          log('error', 'shutdown_failed', errorMetadata(error));
          process.exitCode = 1;
        }),
    );
    try {
      await app.listen(config.port, config.host);
    } catch (error) {
      await app.close();
      throw error;
    }
    log('info', 'backend_started', { port: config.port, host: config.host });
  } catch (error) {
    await db.$disconnect();
    throw error;
  }
}
void main().catch((error) => {
  log('error', 'startup_failed', {
    ...errorMetadata(error),
    message:
      'Check required configuration, database connectivity and applied migrations.',
  });
  process.exitCode = 1;
});
