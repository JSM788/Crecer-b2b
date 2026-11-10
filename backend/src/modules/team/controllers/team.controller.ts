import { z } from 'zod';
import { pageResultSchema, paginationQuerySchema, PaginationQuery } from '../../../common/pagination';
import { MemberListQuery } from '../../platform/dto/platform.dto';
import { OperationKey } from '../../../common/decorators/operation-key.decorator';
import { emptyInvitationInput, resendInvitationSchema, accessEventSchema } from '../../invitations/invitation.dto';
import { Body, Controller, Param, Query, UseGuards } from '@nestjs/common';
import { Endpoint } from '../../../common/decorators/endpoint.decorator';
import { CurrentPrincipal } from '../../../common/decorators/principal.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import { Principal } from '../../../common/types/principal';
import { teamMemberResponseSchema, teamQuerySchema, teamProfileSchema, TeamProfileInput } from '../dto/team.dto';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { TeamService } from '../services/team.service';

@Controller('v1/team')
@UseGuards(SessionGuard)
export class TeamController {
  constructor(private readonly team: TeamService) {}
  @Endpoint({ method: 'post', path: 'members/:membershipId/details', input: teamProfileSchema, output: teamMemberResponseSchema, operationKey: true })
  editProfile(
    @CurrentPrincipal() principal: Principal,
    @OperationKey() key: string,
    @Param('membershipId', new ZodValidationPipe(z.uuid())) membershipId: string,
    @Body(new ZodValidationPipe(teamProfileSchema)) input: TeamProfileInput,
  ) { return this.team.editProfile(principal, key, membershipId, input); }
  @Endpoint({
    method: 'get',
    path: 'members',
    query: teamQuerySchema,
    output: pageResultSchema(teamMemberResponseSchema),
  })
  members(
    @CurrentPrincipal() principal: Principal,
    @Query(new ZodValidationPipe(teamQuerySchema))
    query: MemberListQuery,
  ) {
    return this.team.list(principal, query);
  }
  @Endpoint({ method: 'post', path: 'members/:membershipId/invitation', input: emptyInvitationInput, output: resendInvitationSchema, operationKey: true })
  resendInvitation(
    @CurrentPrincipal() principal: Principal,
    @OperationKey() key: string,
    @Param('membershipId', new ZodValidationPipe(z.uuid())) membershipId: string,
    @Body(new ZodValidationPipe(emptyInvitationInput)) _input: Record<string, never>,
  ) { return this.team.resendInvitation(principal, key, membershipId); }
  @Endpoint({ method: 'get', path: 'members/:membershipId/access-history', query: paginationQuerySchema.strict(), output: pageResultSchema(accessEventSchema) })
  history(
    @CurrentPrincipal() principal: Principal,
    @Param('membershipId', new ZodValidationPipe(z.uuid())) membershipId: string,
    @Query(new ZodValidationPipe(paginationQuerySchema.strict())) query: PaginationQuery,
  ) { return this.team.history(principal, membershipId, query); }
}
