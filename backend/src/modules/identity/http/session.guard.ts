import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { reject } from '../../../shared/domain/application-error';
import { HttpRequest } from '../../../platform/http/http-context';
import { Principal } from '../domain/principal';
import { IdentityFacade } from './identity.facade';
import { TenantResolver } from '../../../platform/tenancy/tenant-routing.module';

export interface AuthenticatedRequest extends HttpRequest {
  principal: Principal;
}

export const SESSION_AUTHENTICATOR = Symbol('SESSION_AUTHENTICATOR');

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(@Inject(SESSION_AUTHENTICATOR) private readonly identity: Pick<IdentityFacade, 'authenticate'>, private readonly tenants: TenantResolver) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith('Bearer ')) reject('authentication_required');
    request.principal = await this.identity.authenticate(authorization.slice(7), this.tenants.resolve(request.headers['x-tenant-host']));
    return true;
  }
}
