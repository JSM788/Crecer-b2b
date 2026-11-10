import { reject } from '../../../shared/domain/application-error';
import { isSessionToken } from '../domain/account';
import type { Principal } from '../domain/principal';
import type { TokenGenerator } from './ports/credentials';
import type { IdentityRepository } from './ports/identity-repository';

export class Authenticate {
  constructor(private readonly repository: IdentityRepository, private readonly tokens: TokenGenerator) {}

  async execute(token: string, company?: string): Promise<Principal> {
    if (!isSessionToken(token)) reject('authentication_required');
    const principal = await this.repository.findActivePrincipal(this.tokens.digest(token), company);
    if (!principal) reject('authentication_required');
    return principal;
  }
}
