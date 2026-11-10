import { Module } from '@nestjs/common';
import { FieldCommandsService } from './services/field-commands.service';

@Module({ providers: [FieldCommandsService], exports: [FieldCommandsService] })
export class FieldCommandsModule {}
