import { Body, Controller, Query, Res, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { Endpoint } from '../../../../common/decorators/endpoint.decorator';
import { CurrentPrincipal } from '../../../../common/decorators/principal.decorator';
import { OperationKey } from '../../../../common/decorators/operation-key.decorator';
import { SessionGuard } from '../../../../common/guards/session.guard';
import { ZodValidationPipe } from '../../../../common/http/zod-validation.pipe';
import { Principal } from '../../../../common/types/principal';
import { JsonResponse } from '../../../../common/types/http';
import { emptyBodySchema } from '../../../identity/dto/login.dto';
import { workdayResponseSchema } from '../dto/workday.dto';
import { WorkdaysService } from '../services/workdays.service';
import { pageResultSchema, PaginationQuery, paginationQuerySchema } from '../../../../common/pagination';

@Controller('v1/me')
@UseGuards(SessionGuard)
export class WorkdaysController {
  constructor(private readonly workdays: WorkdaysService) {}

  @Endpoint({
    method: 'get',
    path: 'workday',
    output: workdayResponseSchema.nullable(),
  })
  async current(
    @CurrentPrincipal() principal: Principal,
    @Res() response: JsonResponse,
  ): Promise<void> {
    response.json(await this.workdays.current(principal));
  }

  @Endpoint({
    method: 'get',
    path: 'workdays',
    query: paginationQuerySchema,
    output: pageResultSchema(workdayResponseSchema),
  })
  list(@CurrentPrincipal() principal: Principal,
    @Query(new ZodValidationPipe(paginationQuerySchema)) filters: PaginationQuery) {
    return this.workdays.list(principal, filters);
  }

  @Endpoint({
    method: 'post',
    path: 'workdays/start',
    input: emptyBodySchema,
    output: workdayResponseSchema,
    operationKey: true,
  })
  start(
    @CurrentPrincipal() principal: Principal,
    @OperationKey() key: string,
    @Body(new ZodValidationPipe(emptyBodySchema)) _input: Record<string, never>,
  ) {
    return this.workdays.start(principal, key);
  }

  @Endpoint({
    method: 'post',
    path: 'workdays/end',
    input: emptyBodySchema,
    output: workdayResponseSchema,
    operationKey: true,
  })
  end(
    @CurrentPrincipal() principal: Principal,
    @OperationKey() key: string,
    @Body(new ZodValidationPipe(emptyBodySchema)) _input: Record<string, never>,
  ) {
    return this.workdays.end(principal, key);
  }
}
