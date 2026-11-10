import { Module } from '@nestjs/common';
import { FieldCommandsModule } from '../field-commands.module';
import { FieldManagementController } from './controllers/field-management.controller';
import { FieldManagementService } from './services/field-management.service';
import { IdentityModule } from '../../identity/identity.module';

@Module({
  imports: [FieldCommandsModule, IdentityModule],
  controllers: [FieldManagementController],
  providers: [FieldManagementService],
})
export class FieldManagementModule {}
