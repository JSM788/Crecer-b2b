import type { Database, Sql } from '../../../platform/database';
import type { Account } from '../domain/account';
import type { Principal, MembershipRole } from '../domain/principal';
import type { IdentityRepository, IdentityUnitOfWork, NewCompany, NewSession, StoredUser } from '../application/ports/identity-repository';

type AccountRow = {
  id: string;
  password_hash: string;
  blocked_until: Date | string | null;
  company_id: string;
  membership_id: string;
};
type PrincipalRow = { company_id: string; membership_id: string; user_id: string; role: MembershipRole; email: string; time_zone: string };
type UserRow = { id: string; password_hash: string };

export class PostgresIdentityRepository implements IdentityRepository {
  constructor(private readonly sql: Sql) {}

  async findAccount(companySlug: string, email: string): Promise<Account | null> {
    const [row] = await this.sql.query<AccountRow>(`SELECT u.id,u.password_hash,u.blocked_until,
      m.id AS membership_id,m.company_id FROM users u
      JOIN memberships m ON m.user_id=u.id JOIN companies c ON c.id=m.company_id
      WHERE c.slug=$1 AND u.email=$2 AND m.active`, [companySlug, email]);
    return row ? { userId: row.id, passwordHash: row.password_hash,
      blockedUntil: row.blocked_until === null ? null : new Date(row.blocked_until),
      companyId: row.company_id, membershipId: row.membership_id } : null;
  }

  async recordFailure(userId: string, maxFailures: number, lockMinutes: number): Promise<void> {
    await this.sql.query(`UPDATE users SET failures=failures+1,
      blocked_until=CASE WHEN failures+1 >= $2 THEN now()+($3 * interval '1 minute')
      ELSE blocked_until END WHERE id=$1`, [userId, maxFailures, lockMinutes]);
  }

  async resetFailures(userId: string): Promise<void> {
    await this.sql.query('UPDATE users SET failures=0, blocked_until=NULL WHERE id=$1', [userId]);
  }

  async createSession(session: NewSession): Promise<void> {
    await this.sql.query('INSERT INTO sessions(token_hash,company_id,membership_id,expires_at) VALUES($1,$2,$3,$4)',
      [session.tokenHash, session.companyId, session.membershipId, session.expiresAt]);
  }

  async findActivePrincipal(tokenHash: string, companySlug?: string): Promise<Principal | null> {
    const [row] = await this.sql.query<PrincipalRow>(`SELECT s.company_id,s.membership_id,m.user_id,m.role,u.email,c.time_zone
      FROM sessions s JOIN memberships m ON m.company_id=s.company_id AND m.id=s.membership_id
      JOIN companies c ON c.id=s.company_id
      JOIN users u ON u.id=m.user_id
      WHERE s.token_hash=$1 AND s.expires_at>now() AND m.active AND ($2::text IS NULL OR c.slug=$2)`, [tokenHash,companySlug ?? null]);
    return row ? { companyId: row.company_id, membershipId: row.membership_id,
      userId: row.user_id, role: row.role, email: row.email, timeZone: row.time_zone, tokenHash } : null;
  }

  async deleteSession(tokenHash: string): Promise<void> {
    await this.sql.query('DELETE FROM sessions WHERE token_hash=$1', [tokenHash]);
  }

  async findUserForUpdate(email: string): Promise<StoredUser | null> {
    const [row] = await this.sql.query<UserRow>('SELECT id,password_hash FROM users WHERE email=$1 FOR UPDATE', [email]);
    return row ? { userId: row.id, passwordHash: row.password_hash } : null;
  }

  async createUser(userId: string, email: string, passwordHash: string): Promise<void> {
    await this.sql.query('INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)', [userId, email, passwordHash]);
  }

  async supportsTimeZone(timeZone: string): Promise<boolean> {
    return (await this.sql.query<{ name: string }>('SELECT name FROM pg_timezone_names WHERE name=$1', [timeZone])).length > 0;
  }

  async createCompany(company: NewCompany): Promise<void> {
    await this.sql.query('INSERT INTO companies(id,slug,name,time_zone) VALUES($1,$2,$3,$4)',
      [company.companyId, company.slug, company.name, company.timeZone]);
  }

  async createCommercialMembership(membershipId: string, companyId: string, userId: string): Promise<void> {
    await this.sql.query("INSERT INTO memberships(id,company_id,user_id,role) VALUES($1,$2,$3,'commercial')",
      [membershipId, companyId, userId]);
  }
}

export class PostgresIdentityUnitOfWork implements IdentityUnitOfWork {
  constructor(private readonly database: Database) {}

  run<T>(operation: (repository: IdentityRepository) => Promise<T>): Promise<T> {
    return this.database.transaction(sql => operation(new PostgresIdentityRepository(sql)));
  }
}
