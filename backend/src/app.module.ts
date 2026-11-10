import { DynamicModule, Module } from '@nestjs/common';
import { PrismaService } from './database/prisma.service';
import { PrismaModule } from './database/prisma.module';
import { IdentityModule } from './modules/identity/identity.module';
import { CustomersModule } from './modules/customers/customers.module';
import { FieldOperationsModule } from './modules/field-operations/field-operations.module';
import { SystemModule } from './modules/system/system.module';
import { TenantDomain } from './config/tenant-domains';
import { TenantRoutingModule } from './common/guards/tenant-routing.module';
import { PlatformModule } from './modules/platform/platform.module';
import { TeamModule } from './modules/team/team.module';
import { InvitationsModule } from './modules/invitations/invitations.module';

@Module({})
export class AppModule {
  static register(
    prisma: PrismaService,
    tenantDomains: TenantDomain[],
  ): DynamicModule {
    return {
      module: AppModule,
      imports: [
        PrismaModule.register(prisma),
        TenantRoutingModule.register(tenantDomains),
        IdentityModule,
        CustomersModule,
        FieldOperationsModule,
        SystemModule,
        PlatformModule,
        TeamModule,
        InvitationsModule,
      ],
    };
  }
}
