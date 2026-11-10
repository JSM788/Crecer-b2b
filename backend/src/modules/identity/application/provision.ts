import { reject } from '../../../shared/domain/application-error';
import type { PasswordHasher, TokenGenerator } from './ports/credentials';
import type { IdentityUnitOfWork } from './ports/identity-repository';

export interface ProvisionInput {
  slug: string;
  name: string;
  email: string;
  password: string;
  timeZone: string;
}

export interface ProvisionedMembership {
  companyId: string;
  membershipId: string;
  userId: string;
}

/** Operator-only use case; never exposed as public tenant administration. */
export class Provision {
  constructor(private readonly unitOfWork: IdentityUnitOfWork, private readonly passwords: PasswordHasher,
    private readonly tokens: TokenGenerator) {}

  async execute(input: ProvisionInput): Promise<ProvisionedMembership> {
    const companyId = this.tokens.createId();
    const membershipId = this.tokens.createId();
    const passwordHash = await this.passwords.hash(input.password);
    return this.unitOfWork.run(async repository => {
      const existing = await repository.findUserForUpdate(input.email);
      if (existing && !await this.passwords.matches(input.password, existing.passwordHash)) {
        reject('existing_identity_password_mismatch');
      }
      const userId = existing?.userId ?? this.tokens.createId();
      if (!existing) await repository.createUser(userId, input.email, passwordHash);
      if (!await repository.supportsTimeZone(input.timeZone)) reject('invalid_time_zone');
      await repository.createCompany({ companyId, slug: input.slug, name: input.name, timeZone: input.timeZone });
      await repository.createCommercialMembership(membershipId, companyId, userId);
      return { companyId, membershipId, userId };
    });
  }
}
