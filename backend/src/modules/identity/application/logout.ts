import type { Principal } from '../domain/principal';
import type { IdentityRepository } from './ports/identity-repository';

export class Logout {
  constructor(private readonly repository: IdentityRepository) {}

  async execute(principal: Principal): Promise<{ loggedOut: true }> {
    await this.repository.deleteSession(principal.tokenHash);
    return { loggedOut: true };
  }
}
