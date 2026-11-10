import { Module } from '@nestjs/common';
import { IdentityModule } from '../../identity/identity.module';
import { FieldCommandsModule } from '../field-commands.module';
import { VisitsController } from './controllers/visits.controller';
import { VisitsService } from './services/visits.service';

@Module({
  imports: [IdentityModule, FieldCommandsModule],
  controllers: [VisitsController],
  providers: [VisitsService],
})
export class VisitsModule {}
