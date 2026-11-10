export interface PasswordHasher {
  hash(password: string): Promise<string>;
  matches(password: string, encoded: string): Promise<boolean>;
  compareUnknownAccount(password: string): Promise<void>;
}

export interface TokenGenerator {
  generate(): string;
  digest(token: string): string;
  createId(): string;
}

export interface Clock {
  now(): Date;
}

export interface IdentityPolicy {
  sessionTtlHours: number;
  maxLoginFailures: number;
  loginLockMinutes: number;
}
