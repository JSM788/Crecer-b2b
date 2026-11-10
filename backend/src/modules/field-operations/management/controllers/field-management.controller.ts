import { Body, Controller, Param, Query, Res, UseGuards } from '@nestjs/common';
import { Endpoint } from '../../../../common/decorators/endpoint.decorator';
import { CurrentPrincipal } from '../../../../common/decorators/principal.decorator';
import { OperationKey } from '../../../../common/decorators/operation-key.decorator';
import { SessionGuard } from '../../../../common/guards/session.guard';
import { ZodValidationPipe } from '../../../../common/http/zod-validation.pipe';
import { Principal } from '../../../../common/types/principal';
import { JsonResponse } from '../../../../common/types/http';
import {
  evidenceSchema,
  idSchema,
  visitResponseSchema,
} from '../../visits/dto/visit.dto';
import {
  FieldFilters,
  TeamSchedule,
  fieldCustomersSchema,
  fieldFiltersSchema,
  fieldMemberSchema,
  teamAgendaSchema,
  teamScheduleSchema,
  teamWorkdaysSchema,
  fieldMembersPageSchema,
  fieldCustomersPageSchema,
  teamAgendaPageSchema,
  teamWorkdaysPageSchema,
  rescheduleVisitSchema,
  cancelVisitSchema,
  RescheduleVisit,
  CancelVisit,
  syncWeeklyRoutesSchema,
  syncWeeklyRoutesResponseSchema,
  SyncWeeklyRoutesDto,
} from '../dto/field-management.dto';
import { FieldManagementService } from '../services/field-management.service';

@Controller('v1/field-operations')
@UseGuards(SessionGuard)
export class FieldManagementController {
  constructor(private readonly management: FieldManagementService) {}

  @Endpoint({
    method: 'get',
    path: 'members',
    query: fieldFiltersSchema,
    output: fieldMembersPageSchema,
  })
  members(@CurrentPrincipal() principal: Principal,
    @Query(new ZodValidationPipe(fieldFiltersSchema)) filters: FieldFilters) {
    return this.management.members(principal, filters);
  }

  @Endpoint({
    method: 'get',
    path: 'members/:id/customers',
    query: fieldFiltersSchema,
    output: fieldCustomersPageSchema,
  })
  customers(
    @CurrentPrincipal() principal: Principal,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Query(new ZodValidationPipe(fieldFiltersSchema)) filters: FieldFilters,
  ) {
    return this.management.customers(principal, id, filters);
  }

  @Endpoint({
    method: 'get',
    path: 'agenda',
    query: fieldFiltersSchema,
    output: teamAgendaPageSchema,
  })
  agenda(
    @CurrentPrincipal() principal: Principal,
    @Query(new ZodValidationPipe(fieldFiltersSchema)) filters: FieldFilters,
  ) {
    return this.management.agenda(principal, filters);
  }

  @Endpoint({
    method: 'get',
    path: 'workdays',
    query: fieldFiltersSchema,
    output: teamWorkdaysPageSchema,
  })
  workdays(
    @CurrentPrincipal() principal: Principal,
    @Query(new ZodValidationPipe(fieldFiltersSchema)) filters: FieldFilters,
  ) {
    return this.management.workdays(principal, filters);
  }

  @Endpoint({
    method: 'post',
    path: 'visits',
    input: teamScheduleSchema,
    output: visitResponseSchema,
    operationKey: true,
  })
  schedule(
    @CurrentPrincipal() principal: Principal,
    @OperationKey() key: string,
    @Body(new ZodValidationPipe(teamScheduleSchema)) input: TeamSchedule,
  ) {
    return this.management.schedule(principal, key, input);
  }

  @Endpoint({ method: 'post', path: 'visits/:id/reschedule', input: rescheduleVisitSchema, output: visitResponseSchema, operationKey: true })
  reschedule(@CurrentPrincipal() principal: Principal,
    @OperationKey() key: string,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(rescheduleVisitSchema)) input: RescheduleVisit) {
    return this.management.reschedule(principal, key, id, input);
  }

  @Endpoint({ method: 'post', path: 'visits/:id/cancel', input: cancelVisitSchema, output: visitResponseSchema, operationKey: true })
  cancel(@CurrentPrincipal() principal: Principal,
    @OperationKey() key: string,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(cancelVisitSchema)) input: CancelVisit) {
    return this.management.cancel(principal, key, id, input);
  }

  @Endpoint({
    method: 'post',
    path: 'routes/sync',
    input: syncWeeklyRoutesSchema,
    output: syncWeeklyRoutesResponseSchema,
    operationKey: true,
  })
  syncWeeklyRoutes(
    @CurrentPrincipal() principal: Principal,
    @OperationKey() key: string,
    @Body(new ZodValidationPipe(syncWeeklyRoutesSchema))
    input: SyncWeeklyRoutesDto,
  ) {
    return this.management.syncWeeklyRoutes(principal, key, input);
  }

  @Endpoint({
    method: 'get',
    path: 'visits/:id/evidence',
    output: evidenceSchema.nullable(),
  })
  async evidence(
    @CurrentPrincipal() principal: Principal,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Res() response: JsonResponse,
  ): Promise<void> {
    response.json(await this.management.evidence(principal, id));
  }
}
