import { Module } from '@nestjs/common';
import { IdentityModule } from '../../identity/identity.module';
import { FieldCommandsModule } from '../field-commands.module';
import { WorkdaysController } from './controllers/workdays.controller';
import { WorkdaysService } from './services/workdays.service';

@Module({
  imports: [IdentityModule, FieldCommandsModule],
  controllers: [WorkdaysController],
  providers: [WorkdaysService],
})
export class WorkdaysModule {}
