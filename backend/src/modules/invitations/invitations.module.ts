import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { MailModule } from '../mail/mail.module';
import { InvitationsService } from './invitations.service';
import { InvitationsController } from './invitations.controller';
@Module({ imports: [IdentityModule, MailModule], controllers: [InvitationsController], providers: [InvitationsService], exports: [InvitationsService, MailModule] })
export class InvitationsModule {}
