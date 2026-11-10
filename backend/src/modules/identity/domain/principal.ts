export type MembershipRole = 'commercial' | 'merchandiser';

export interface Principal {
  companyId: string;
  membershipId: string;
  userId: string;
  role: MembershipRole;
  email: string;
  timeZone: string;
  tokenHash: string;
}
