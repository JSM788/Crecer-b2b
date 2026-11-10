import { reject } from '../../../shared/domain/application-error';
import { isAccountLocked } from '../domain/account';
import type { Clock, IdentityPolicy, PasswordHasher, TokenGenerator } from './ports/credentials';
import type { IdentityRepository, IdentityUnitOfWork } from './ports/identity-repository';

export interface LoginInput {
  company: string;
  email: string;
  password: string;
}

export class Login {
  constructor(
    private readonly repository: IdentityRepository,
    private readonly unitOfWork: IdentityUnitOfWork,
    private readonly passwords: PasswordHasher,
    private readonly tokens: TokenGenerator,
    private readonly clock: Clock,
    private readonly policy: IdentityPolicy,
  ) {}

  async execute(input: LoginInput): Promise<{ token: string; expiresAt: string }> {
    const account = await this.repository.findAccount(input.company, input.email);
    if (!account) {
      await this.passwords.compareUnknownAccount(input.password);
      reject('invalid_credentials');
    }
    const valid = await this.passwords.matches(input.password, account.passwordHash);
    if (!valid || isAccountLocked(account, this.clock.now())) {
      await this.repository.recordFailure(account.userId, this.policy.maxLoginFailures, this.policy.loginLockMinutes);
      reject('invalid_credentials');
    }
    const token = this.tokens.generate();
    const expiresAt = new Date(this.clock.now().getTime() + this.policy.sessionTtlHours * 60 * 60 * 1000).toISOString();
    await this.unitOfWork.run(async repository => {
      await repository.resetFailures(account.userId);
      await repository.createSession({ tokenHash: this.tokens.digest(token), companyId: account.companyId,
        membershipId: account.membershipId, expiresAt });
    });
    return { token, expiresAt };
  }
}
