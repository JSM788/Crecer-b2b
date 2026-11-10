import { Body, Controller, Param } from '@nestjs/common';
import { Endpoint } from '../../common/decorators/endpoint.decorator';
import { ZodValidationPipe } from '../../common/http/zod-validation.pipe';
import { InvitationsService } from './invitations.service';
import { invitationTokenSchema, acceptInvitationSchema, invitationInfoSchema, acceptedInvitationSchema } from './invitation.dto';

@Controller('v1/invitations')
export class InvitationsController {
  constructor(private readonly invitations: InvitationsService) {}
  @Endpoint({ method: 'get', path: ':token', public: true, output: invitationInfoSchema })
  inspect(@Param('token', new ZodValidationPipe(invitationTokenSchema)) token: string) {
    return this.invitations.inspect(token);
  }
  @Endpoint({ method: 'post', path: ':token/accept', public: true, input: acceptInvitationSchema, output: acceptedInvitationSchema })
  accept(
    @Param('token', new ZodValidationPipe(invitationTokenSchema)) token: string,
    @Body(new ZodValidationPipe(acceptInvitationSchema)) input: { password: string },
  ) {
    return this.invitations.accept(token, input.password);
  }
}
