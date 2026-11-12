import { Body, Controller, Param, Res, UseGuards } from '@nestjs/common';
import { Endpoint } from '../../../../common/decorators/endpoint.decorator';
import { CurrentPrincipal } from '../../../../common/decorators/principal.decorator';
import { OperationKey } from '../../../../common/decorators/operation-key.decorator';
import { SessionGuard } from '../../../../common/guards/session.guard';
import { ZodValidationPipe } from '../../../../common/http/zod-validation.pipe';
import { Principal } from '../../../../common/types/principal';
import { JsonResponse } from '../../../../common/types/http';
import {
  CheckInDto,
  checkInSchema,
  CloseVisitDto,
  closeSchema,
  evidenceSchema,
  idSchema,
  ScheduleVisitDto,
  scheduleSchema,
  visitResponseSchema,
} from '../dto/visit.dto';
import { VisitsService } from '../services/visits.service';

@Controller('v1/me/visits')
@UseGuards(SessionGuard)
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Endpoint({
    method: 'post',
    input: scheduleSchema,
    output: visitResponseSchema,
    operationKey: true,
  })
  schedule(
    @CurrentPrincipal() principal: Principal,
    @OperationKey() key: string,
    @Body(new ZodValidationPipe(scheduleSchema)) input: ScheduleVisitDto,
  ) {
    return this.visits.schedule(principal, key, input);
  }

  @Endpoint({
    method: 'get',
    path: ':id/evidence',
    output: evidenceSchema.nullable(),
  })
  async evidence(
    @CurrentPrincipal() principal: Principal,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Res() response: JsonResponse,
  ): Promise<void> {
    response.json(await this.visits.evidence(principal, id));
  }

  @Endpoint({
    method: 'post',
    path: ':id/check-in',
    input: checkInSchema,
    output: visitResponseSchema,
    operationKey: true,
  })
  checkIn(
    @CurrentPrincipal() principal: Principal,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @OperationKey() key: string,
    @Body(new ZodValidationPipe(checkInSchema)) input: CheckInDto,
  ) {
    return this.visits.checkIn(principal, key, id, input);
  }

  @Endpoint({
    method: 'post',
    path: ':id/close',
    input: closeSchema,
    output: visitResponseSchema,
    operationKey: true,
  })
  close(
    @CurrentPrincipal() principal: Principal,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @OperationKey() key: string,
    @Body(new ZodValidationPipe(closeSchema)) input: CloseVisitDto,
  ) {
    return this.visits.close(principal, key, id, input);
  }
}
