export type MembershipRole = 'commercial' | 'merchandiser' | 'manager';
export type Permission =
  'manage_customers' | 'manage_field_operations' | 'manage_platform';

export interface Principal {
  scope: 'tenant';
  companyId: string;
  membershipId: string;
  userId: string;
  role: MembershipRole;
  email: string;
  timeZone: string;
  tokenHash: string;
  permissions?: readonly Permission[];
}

export interface PlatformPrincipal {
  scope: 'platform';
  userId: string;
  email: string;
  tokenHash: string;
  role: 'platform_owner';
  companyId: null;
  membershipId: null;
  timeZone: null;
  permissions: readonly ['manage_platform'];
}

export type AuthenticatedPrincipal = Principal | PlatformPrincipal;
