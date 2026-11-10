import { z } from 'zod';
import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { loadConfig } from './config/environment';
import { PrismaService } from './database/prisma.service';
import { log, errorMetadata } from './common/logging';
import { CredentialsService } from './modules/identity/services/credentials.service';
import { OperatorService } from './modules/identity/services/operator.service';
import { credentialsSchema } from './modules/identity/dto/login.dto';
import { createApp } from './app';
import { ApiDocumentService } from './modules/system/services/api-document.service';

async function main(): Promise<void> {
  const prisma = new PrismaService(loadConfig().databaseUrl);
  const operator = new OperatorService(prisma, new CredentialsService());
  const required = (name: string): string =>
    z.string().min(1).parse(process.env[name]);
  try {
    switch (process.argv[2]) {
      case 'provision': {
        const credentials = credentialsSchema.parse({
          email: required('USER_EMAIL'),
          password: required('USER_PASSWORD'),
        });
        console.log(
          JSON.stringify(
            await operator.provision(
              z
                .string()
                .regex(/^[a-z0-9-]{1,64}$/)
                .parse(required('COMPANY_SLUG')),
              z.string().trim().min(1).max(150).parse(required('COMPANY_NAME')),
              credentials.email,
              credentials.password,
              required('COMPANY_TIME_ZONE'),
              z
                .enum(['commercial', 'merchandiser', 'manager'])
                .parse(process.env.USER_ROLE ?? 'commercial'),
            ),
          ),
        );
        break;
      }
      case 'assign-visit':
        console.log(
          JSON.stringify(
            await operator.assignVisit({
              companyId: z.uuid().parse(required('COMPANY_ID')),
              membershipId: z.uuid().parse(required('MEMBERSHIP_ID')),
              scheduledAt: z.iso
                .datetime({ offset: true })
                .parse(required('SCHEDULED_AT')),
              customerName: required('CUSTOMER_NAME'),
              customerAddress: required('CUSTOMER_ADDRESS'),
            }),
          ),
        );
        break;
      case 'grant-customer-management':
        await operator.grantCustomerManagement(
          z.uuid().parse(required('COMPANY_ID')),
          z.uuid().parse(required('MEMBERSHIP_ID')),
        );
        console.log('Customer management capability granted.');
        break;
      case 'grant-platform-owner':
        await operator.grantPlatformOwnership(
          z.email().max(254).parse(required('USER_EMAIL')),
        );
        console.log(
          'Global platform ownership granted to the existing account.',
        );
        break;
      case 'add-member': {
        const credentials = credentialsSchema.parse({
          email: required('USER_EMAIL'),
          password: required('USER_PASSWORD'),
        });
        console.log(
          JSON.stringify(
            await operator.addMember(
              z.uuid().parse(required('COMPANY_ID')),
              credentials.email,
              credentials.password,
              z
                .enum(['commercial', 'merchandiser', 'manager'])
                .parse(process.env.USER_ROLE ?? 'commercial'),
            ),
          ),
        );
        break;
      }
      case 'grant-field-management':
        await operator.grantFieldManagement(
          z.uuid().parse(required('COMPANY_ID')),
          z.uuid().parse(required('MEMBERSHIP_ID')),
        );
        console.log('Field operations management capability granted.');
        break;
      case 'contract': {
        const app = await createApp(prisma, false);
        try {
          await writeFile(
            resolve('contracts/openapi.json'),
            JSON.stringify(app.get(ApiDocumentService).document(), null, 2) +
              '\n',
          );
        } finally {
          await app.close();
        }
        break;
      }
      default:
        throw new Error('Unknown operator command');
    }
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  log('error', 'operator_command_failed', {
    ...errorMetadata(error),
    message:
      'Check command, required environment variables and database constraints.',
  });
  process.exitCode = 1;
});
