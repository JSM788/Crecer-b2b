import { Body, Controller, Headers, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { Endpoint } from '../../../common/decorators/endpoint.decorator';
import { CurrentPrincipal } from '../../../common/decorators/principal.decorator';
import { ZodValidationPipe } from '../../../common/http/zod-validation.pipe';
import { SessionGuard } from '../../../common/guards/session.guard';
import { TenantResolver } from '../../../common/guards/tenant-routing.module';
import { AuthenticatedPrincipal } from '../../../common/types/principal';
import { AuthService } from '../services/auth.service';
import {
  credentialsSchema,
  emptyBodySchema,
  LoginDto,
  loginResponseSchema,
} from '../dto/login.dto';

@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly tenants: TenantResolver,
  ) {}

  @Endpoint({
    method: 'post',
    path: 'login',
    input: credentialsSchema,
    output: loginResponseSchema,
    public: true,
  })
  async login(
    @Body(new ZodValidationPipe(credentialsSchema)) input: LoginDto,
    @Headers('x-tenant-host') host: string | undefined,
  ) {
    return this.auth.login(host === undefined ? undefined : await this.tenants.resolve(host), input);
  }

  @Endpoint({
    method: 'post',
    path: 'web/login',
    input: credentialsSchema,
    output: loginResponseSchema,
    public: true,
  })
  async webLogin(
    @Body(new ZodValidationPipe(credentialsSchema)) input: LoginDto,
    @Headers('x-tenant-host') host: string | undefined,
  ) {
    return this.auth.login(host === undefined ? undefined : await this.tenants.resolve(host), input, true);
  }

  @Endpoint({
    method: 'post',
    path: 'logout',
    input: emptyBodySchema,
    output: z.object({ loggedOut: z.literal(true) }),
  })
  @UseGuards(SessionGuard)
  logout(
    @CurrentPrincipal() principal: AuthenticatedPrincipal,
    @Body(new ZodValidationPipe(emptyBodySchema)) _input: Record<string, never>,
  ) {
    return this.auth.logout(principal);
  }
}
