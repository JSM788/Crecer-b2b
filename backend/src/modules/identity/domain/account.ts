export interface Account {
  userId: string;
  passwordHash: string;
  blockedUntil: Date | null;
  companyId: string;
  membershipId: string;
}

export function isAccountLocked(account: Account, now: Date): boolean {
  return account.blockedUntil !== null && account.blockedUntil.getTime() > now.getTime();
}

export function isSessionToken(token: string): boolean {
  return /^[A-Za-z0-9_-]{43}$/.test(token);
}
