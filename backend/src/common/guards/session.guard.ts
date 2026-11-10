import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from '../../modules/identity/services/auth.service';
import { reject } from '../errors/application-error';
import { TenantResolver } from './tenant-routing.module';
import { canAccessWebRole } from '../web-access-policy';

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly identity: AuthService,
    private readonly tenants: TenantResolver,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    if (
      typeof authorization !== 'string' ||
      !authorization.startsWith('Bearer ')
    )
      reject('authentication_required');
    request.principal = await this.identity.authenticate(
      authorization.slice(7),
      request.headers['x-tenant-host'] === undefined
        ? undefined
        : await this.tenants.resolve(request.headers['x-tenant-host']),
    );
    if (
      request.headers['x-client-channel'] === 'web' &&
      !canAccessWebRole(request.principal.role)
    ) reject('web_access_denied');
    if (
      request.principal.scope === 'platform' &&
      !/^\/v1\/(?:platform(?:\/|$)|me\/?$|auth\/logout\/?$)/.test(request.path)
    )
      reject('platform_scope_only');
    return true;
  }
}
