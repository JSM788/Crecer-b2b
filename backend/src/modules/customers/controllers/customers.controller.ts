import { Body, Controller, Query, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { Endpoint } from '../../../common/decorators/endpoint.decorator';
import { CurrentPrincipal } from '../../../common/decorators/principal.decorator';
import { SessionGuard } from '../../../common/guards/session.guard';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { Principal } from '../../../common/types/principal';
import {
  AssignCustomersDto,
  assignCustomersSchema,
  assigneeResponseSchema,
  CreateCustomerDto,
  createCustomerSchema,
  customerResponseSchema,
  ImportCustomersDto,
  importCustomersResponseSchema,
  importCustomersSchema,
  managedCustomerResponseSchema,
  CustomerFilters,
  customerFiltersSchema,
} from '../dto/customer.dto';
import { CustomersService } from '../services/customers.service';
import { pageResultSchema } from '../../../common/pagination';

@Controller('v1')
@UseGuards(SessionGuard)
export class CustomersController {
  constructor(private readonly customers: CustomersService) {}

  @Endpoint({
    method: 'get',
    path: 'me/customers',
    query: customerFiltersSchema,
    output: pageResultSchema(customerResponseSchema),
  })
  assigned(@CurrentPrincipal() principal: Principal,
    @Query(new ZodValidationPipe(customerFiltersSchema)) filters: CustomerFilters) {
    return this.customers.assigned(principal, filters);
  }

  @Endpoint({
    method: 'get',
    path: 'customers',
    query: customerFiltersSchema,
    output: pageResultSchema(managedCustomerResponseSchema),
  })
  list(@CurrentPrincipal() principal: Principal,
    @Query(new ZodValidationPipe(customerFiltersSchema)) filters: CustomerFilters) {
    return this.customers.list(principal, filters);
  }

  @Endpoint({
    method: 'get',
    path: 'customers/assignees',
    query: customerFiltersSchema,
    output: pageResultSchema(assigneeResponseSchema),
  })
  assignees(@CurrentPrincipal() principal: Principal,
    @Query(new ZodValidationPipe(customerFiltersSchema)) filters: CustomerFilters) {
    return this.customers.assignees(principal, filters);
  }

  @Endpoint({
    method: 'post',
    path: 'customers',
    input: createCustomerSchema,
    output: managedCustomerResponseSchema,
  })
  create(
    @CurrentPrincipal() principal: Principal,
    @Body(new ZodValidationPipe(createCustomerSchema)) input: CreateCustomerDto,
  ) {
    return this.customers.create(principal, input);
  }

  @Endpoint({
    method: 'post',
    path: 'customers/import',
    input: importCustomersSchema,
    output: importCustomersResponseSchema,
  })
  importCustomers(
    @CurrentPrincipal() principal: Principal,
    @Body(new ZodValidationPipe(importCustomersSchema))
    input: ImportCustomersDto,
  ) {
    return this.customers.importCustomers(principal, input);
  }

  @Endpoint({
    method: 'post',
    path: 'customers/assignments',
    input: assignCustomersSchema,
    output: z.object({ updated: z.number().int().min(1) }),
  })
  assign(
    @CurrentPrincipal() principal: Principal,
    @Body(new ZodValidationPipe(assignCustomersSchema))
    input: AssignCustomersDto,
  ) {
    return this.customers.assign(principal, input);
  }
}
