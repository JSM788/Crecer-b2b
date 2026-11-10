import { Body, Controller, Param, Query, UseGuards } from "@nestjs/common";
import { pageResultSchema, paginationQuerySchema, PaginationQuery } from "../../../common/pagination";
import { emptyInvitationInput, resendInvitationSchema, accessEventSchema } from "../../invitations/invitation.dto";
import { Endpoint } from "../../../common/decorators/endpoint.decorator";
import { CurrentPrincipal } from "../../../common/decorators/principal.decorator";
import { OperationKey } from "../../../common/decorators/operation-key.decorator";
import { SessionGuard } from "../../../common/guards/session.guard";
import { ZodValidationPipe } from "../../../common/http/zod-validation.pipe";
import { PlatformPrincipal } from "../../../common/types/principal";
import {
  CompanyInput,
  CompanyListQuery,
  MemberListQuery,
  companyListQuerySchema,
  memberListQuerySchema,
  CompanyStatusInput,
  CompanyEditInput,
  MemberInput,
  MemberEditInput,
  editMemberSchema,
  companyInputSchema,
  editCompanySchema,
  companyResponseSchema,
  companyStatusSchema,
  memberInputSchema,
  memberResponseSchema,
  memberStatusSchema,
  platformIdSchema,
} from "../dto/platform.dto";
import { PlatformService } from "../services/platform.service";

@Controller("v1/platform")
@UseGuards(SessionGuard)
export class PlatformController {
  constructor(private readonly platform: PlatformService) {}

  @Endpoint({
    method: "get",
    path: "companies",
    query: companyListQuerySchema,
    output: pageResultSchema(companyResponseSchema),
  })
  companies(@CurrentPrincipal() principal: PlatformPrincipal, @Query(new ZodValidationPipe(companyListQuerySchema)) query: CompanyListQuery) {
    return this.platform.companies(principal, query);
  }

  @Endpoint({
    method: "post",
    path: "companies",
    input: companyInputSchema,
    output: companyResponseSchema,
    operationKey: true,
  })
  createCompany(
    @CurrentPrincipal() principal: PlatformPrincipal,
    @OperationKey() key: string,
    @Body(new ZodValidationPipe(companyInputSchema)) input: CompanyInput,
  ) {
    return this.platform.createCompany(principal, key, input);
  }

  @Endpoint({
    method: "post",
    path: "companies/:companyId/status",
    input: companyStatusSchema,
    output: companyResponseSchema,
    operationKey: true,
  })
  companyStatus(
    @CurrentPrincipal() principal: PlatformPrincipal,
    @OperationKey() key: string,
    @Param("companyId", new ZodValidationPipe(platformIdSchema))
    companyId: string,
    @Body(new ZodValidationPipe(companyStatusSchema)) input: CompanyStatusInput,
  ) {
    return this.platform.companyStatus(principal, key, companyId, input.status);
  }

  @Endpoint({
    method: "post",
    path: "companies/:companyId/details",
    input: editCompanySchema,
    output: companyResponseSchema,
    operationKey: true,
  })
  editCompany(
    @CurrentPrincipal() principal: PlatformPrincipal,
    @OperationKey() key: string,
    @Param("companyId", new ZodValidationPipe(platformIdSchema))
    companyId: string,
    @Body(new ZodValidationPipe(editCompanySchema)) input: CompanyEditInput,
  ) {
    return this.platform.editCompany(principal, key, companyId, input);
  }

  @Endpoint({
    method: "get",
    path: "companies/:companyId/members",
    query: memberListQuerySchema,
    output: pageResultSchema(memberResponseSchema),
  })
  members(
    @CurrentPrincipal() principal: PlatformPrincipal,
    @Param("companyId", new ZodValidationPipe(platformIdSchema))
    companyId: string,
    @Query(new ZodValidationPipe(memberListQuerySchema)) query: MemberListQuery,
  ) {
    return this.platform.members(principal, companyId, query);
  }

  @Endpoint({
    method: "post",
    path: "companies/:companyId/members",
    input: memberInputSchema,
    output: memberResponseSchema,
    operationKey: true,
  })
  createMember(
    @CurrentPrincipal() principal: PlatformPrincipal,
    @OperationKey() key: string,
    @Param("companyId", new ZodValidationPipe(platformIdSchema))
    companyId: string,
    @Body(new ZodValidationPipe(memberInputSchema)) input: MemberInput,
  ) {
    return this.platform.createMember(principal, key, companyId, input);
  }

  @Endpoint({ method: 'post', path: 'companies/:companyId/members/:membershipId/invitation', input: emptyInvitationInput, output: resendInvitationSchema, operationKey: true })
  resendInvitation(
    @CurrentPrincipal() principal: PlatformPrincipal,
    @OperationKey() key: string,
    @Param('companyId', new ZodValidationPipe(platformIdSchema)) companyId: string,
    @Param('membershipId', new ZodValidationPipe(platformIdSchema)) membershipId: string,
    @Body(new ZodValidationPipe(emptyInvitationInput)) _input: Record<string, never>,
  ) { return this.platform.resendInvitation(principal, key, companyId, membershipId); }
  @Endpoint({ method: 'get', path: 'companies/:companyId/members/:membershipId/access-history', query: paginationQuerySchema.strict(), output: pageResultSchema(accessEventSchema) })
  accessHistory(
    @CurrentPrincipal() principal: PlatformPrincipal,
    @Param('companyId', new ZodValidationPipe(platformIdSchema)) companyId: string,
    @Param('membershipId', new ZodValidationPipe(platformIdSchema)) membershipId: string,
    @Query(new ZodValidationPipe(paginationQuerySchema.strict())) query: PaginationQuery,
  ) { return this.platform.accessHistory(principal, companyId, membershipId, query); }

  @Endpoint({
    method: "post",
    path: "companies/:companyId/members/:membershipId/details",
    input: editMemberSchema,
    output: memberResponseSchema,
    operationKey: true,
  })
  editMember(
    @CurrentPrincipal() principal: PlatformPrincipal,
    @OperationKey() key: string,
    @Param("companyId", new ZodValidationPipe(platformIdSchema))
    companyId: string,
    @Param("membershipId", new ZodValidationPipe(platformIdSchema))
    membershipId: string,
    @Body(new ZodValidationPipe(editMemberSchema)) input: MemberEditInput,
  ) {
    return this.platform.editMember(
      principal,
      key,
      companyId,
      membershipId,
      input,
    );
  }

  @Endpoint({
    method: "post",
    path: "companies/:companyId/members/:membershipId/status",
    input: memberStatusSchema,
    output: memberResponseSchema,
    operationKey: true,
  })
  status(
    @CurrentPrincipal() principal: PlatformPrincipal,
    @OperationKey() key: string,
    @Param("companyId", new ZodValidationPipe(platformIdSchema))
    companyId: string,
    @Param("membershipId", new ZodValidationPipe(platformIdSchema))
    membershipId: string,
    @Body(new ZodValidationPipe(memberStatusSchema)) input: { active: boolean },
  ) {
    return this.platform.status(
      principal,
      key,
      companyId,
      membershipId,
      input.active,
    );
  }
}
