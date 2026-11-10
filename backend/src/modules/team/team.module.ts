import { InvitationsModule } from '../invitations/invitations.module';
import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { TeamController } from './controllers/team.controller';
import { TeamService } from './services/team.service';

@Module({
  imports: [IdentityModule, InvitationsModule],
  controllers: [TeamController],
  providers: [TeamService],
})
export class TeamModule {}
