import { InvitationsModule } from '../invitations/invitations.module';
import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { PlatformController } from './controllers/platform.controller';
import { LogsClientController } from './controllers/logs-client.controller';
import { PlatformAccessService } from './services/platform-access.service';
import { PlatformCommandsService } from './services/platform-commands.service';
import { PlatformService } from './services/platform.service';
import { PlatformLogsService } from './services/platform-logs.service';

@Module({
  imports: [IdentityModule, InvitationsModule],
  controllers: [PlatformController, LogsClientController],
  providers: [PlatformAccessService, PlatformCommandsService, PlatformService, PlatformLogsService],
})
export class PlatformModule {}
