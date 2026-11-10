import type { Account } from '../../domain/account';
import type { Principal } from '../../domain/principal';

export interface StoredUser {
  userId: string;
  passwordHash: string;
}

export interface NewSession {
  tokenHash: string;
  companyId: string;
  membershipId: string;
  expiresAt: string;
}

export interface NewCompany {
  companyId: string;
  slug: string;
  name: string;
  timeZone: string;
}

export interface IdentityRepository {
  findAccount(companySlug: string, email: string): Promise<Account | null>;
  recordFailure(userId: string, maxFailures: number, lockMinutes: number): Promise<void>;
  resetFailures(userId: string): Promise<void>;
  createSession(session: NewSession): Promise<void>;
  findActivePrincipal(tokenHash: string, companySlug?: string): Promise<Principal | null>;
  deleteSession(tokenHash: string): Promise<void>;
  findUserForUpdate(email: string): Promise<StoredUser | null>;
  createUser(userId: string, email: string, passwordHash: string): Promise<void>;
  supportsTimeZone(timeZone: string): Promise<boolean>;
  createCompany(company: NewCompany): Promise<void>;
  createCommercialMembership(membershipId: string, companyId: string, userId: string): Promise<void>;
}

export interface IdentityUnitOfWork {
  run<T>(operation: (repository: IdentityRepository) => Promise<T>): Promise<T>;
}
