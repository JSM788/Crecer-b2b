import { Module } from '@nestjs/common';
import { SessionGuard } from '../../common/guards/session.guard';
import { AuthController } from './controllers/auth.controller';
import { SessionController } from './controllers/session.controller';
import { AuthService } from './services/auth.service';
import { CredentialsService } from './services/credentials.service';
import { OperatorService } from './services/operator.service';

@Module({
  controllers: [AuthController, SessionController],
  providers: [AuthService, CredentialsService, OperatorService, SessionGuard],
  exports: [AuthService, OperatorService, SessionGuard, CredentialsService],
})
export class IdentityModule {}
