import { InvitationsModule } from '../invitations/invitations.module';
import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { PlatformController } from './controllers/platform.controller';
import { PlatformAccessService } from './services/platform-access.service';
import { PlatformCommandsService } from './services/platform-commands.service';
import { PlatformService } from './services/platform.service';

@Module({
  imports: [IdentityModule, InvitationsModule],
  controllers: [PlatformController],
  providers: [PlatformAccessService, PlatformCommandsService, PlatformService],
})
export class PlatformModule {}
