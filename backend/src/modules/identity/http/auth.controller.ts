import { Body, Controller, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../platform/http/zod-validation.pipe';
import { emptyBodySchema } from '../../../platform/http/request.schemas';
import { Principal } from '../domain/principal';
import { IdentityFacade } from './identity.facade';
import { credentialsSchema } from './identity.schemas';
import { TenantResolver } from '../../../platform/tenancy/tenant-routing.module';
import { CurrentPrincipal } from './principal.decorator';
import { SessionGuard } from './session.guard';

export type LoginDto = z.infer<typeof credentialsSchema>;

@Controller('v1/auth')
export class AuthController {
  constructor(private readonly identity: IdentityFacade, private readonly tenants: TenantResolver) {}

  @Post('login')
  @HttpCode(200)
  login(@Body(new ZodValidationPipe(credentialsSchema)) input: LoginDto, @Headers('x-tenant-host') host: string | undefined) {
    return this.identity.login({...input,company:this.tenants.resolve(host)});
  }

  @Post('logout')
  @HttpCode(200)
  @UseGuards(SessionGuard)
  logout(@CurrentPrincipal() principal: Principal, @Body(new ZodValidationPipe(emptyBodySchema)) _input: Record<string, never>) {
    return this.identity.logout(principal);
  }
}
