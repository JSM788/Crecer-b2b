import type { Database } from '../../platform/database';
import { loadPolicy } from '../../platform/config';
import { Authenticate } from './application/authenticate';
import { Login } from './application/login';
import { Logout } from './application/logout';
import { Provision } from './application/provision';
import { IdentityFacade } from './http/identity.facade';
import { CryptoTokenGenerator, ScryptPasswordHasher, SystemClock } from './infrastructure/node-credentials';
import { PostgresIdentityRepository, PostgresIdentityUnitOfWork } from './infrastructure/postgres-identity.repository';

export function createIdentity(database: Database): IdentityFacade {
  const policy = loadPolicy();
  const repository = new PostgresIdentityRepository(database);
  const unitOfWork = new PostgresIdentityUnitOfWork(database);
  const passwords = new ScryptPasswordHasher();
  const tokens = new CryptoTokenGenerator();
  const clock = new SystemClock();
  return new IdentityFacade(
    new Login(repository, unitOfWork, passwords, tokens, clock, {
      sessionTtlHours: policy.SESSION_TTL_HOURS,
      maxLoginFailures: policy.LOGIN_MAX_FAILURES,
      loginLockMinutes: policy.LOGIN_LOCK_MINUTES,
    }),
    new Authenticate(repository, tokens),
    new Logout(repository),
    new Provision(unitOfWork, passwords, tokens),
  );
}

export function provision(database: Database, slug: string, name: string, email: string, password: string, timeZone = 'UTC') {
  return createIdentity(database).provision(slug, name, email, password, timeZone);
}
