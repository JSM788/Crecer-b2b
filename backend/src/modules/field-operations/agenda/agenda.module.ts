import { Module } from '@nestjs/common';
import { IdentityModule } from '../../identity/identity.module';
import { AgendaController } from './controllers/agenda.controller';
import { AgendaService } from './services/agenda.service';

@Module({
  imports: [IdentityModule],
  controllers: [AgendaController],
  providers: [AgendaService],
})
export class AgendaModule {}
