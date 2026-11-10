import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity/identity.module';
import { CustomersController } from './controllers/customers.controller';
import { CustomersService } from './services/customers.service';

@Module({
  imports: [IdentityModule],
  controllers: [CustomersController],
  providers: [CustomersService],
})
export class CustomersModule {}
