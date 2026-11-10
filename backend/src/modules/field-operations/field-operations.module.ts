import { Module } from '@nestjs/common';
import { AgendaModule } from './agenda/agenda.module';
import { WorkdaysModule } from './workdays/workdays.module';
import { VisitsModule } from './visits/visits.module';
import { FieldManagementModule } from './management/field-management.module';

@Module({
  imports: [AgendaModule, WorkdaysModule, VisitsModule, FieldManagementModule],
})
export class FieldOperationsModule {}
