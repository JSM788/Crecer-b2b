import { Controller, Query, UseGuards } from '@nestjs/common';
import { Endpoint } from '../../../../common/decorators/endpoint.decorator';
import { CurrentPrincipal } from '../../../../common/decorators/principal.decorator';
import { SessionGuard } from '../../../../common/guards/session.guard';
import { Principal } from '../../../../common/types/principal';
import { agendaResponseSchema } from '../../visits/dto/visit.dto';
import { AgendaService } from '../services/agenda.service';
import { ZodValidationPipe } from '../../../../common/http/zod-validation.pipe';
import { pageResultSchema } from '../../../../common/pagination';
import { FieldFilters, fieldFiltersSchema } from '../../management/dto/field-management.dto';

@Controller('v1/me/agenda')
@UseGuards(SessionGuard)
export class AgendaController {
  constructor(private readonly agenda: AgendaService) {}
  @Endpoint({ method: 'get', query: fieldFiltersSchema, output: pageResultSchema(agendaResponseSchema.element) })
  list(@CurrentPrincipal() principal: Principal,
    @Query(new ZodValidationPipe(fieldFiltersSchema)) filters: FieldFilters) {
    return this.agenda.list(principal, filters);
  }
}
