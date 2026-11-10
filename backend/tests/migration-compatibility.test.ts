import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import {
  createTestDatabase,
  createIdentity,
  createFieldOperations,
  migrate,
  prismaMigration,
} from './support';
import { CredentialsService } from '../src/modules/identity/services/credentials.service';

test('Prisma baseline adopts legacy records without resetting data, hashes, sessions, evidence or constraints', async () => {
  const db = await createTestDatabase();
  try {
    const legacy =
      (await readFile('migrations/001-foundation.sql', 'utf8')) +
      '\n' +
      (await readFile('migrations/002-visit-planning-evidence.sql', 'utf8'));
    await db.query(legacy);
    await db.query(
      "CREATE TABLE schema_migrations(version text PRIMARY KEY,applied_at timestamptz NOT NULL DEFAULT now()); INSERT INTO schema_migrations(version) VALUES('001'),('002')",
    );
    const companyId = randomUUID(),
      userId = randomUUID(),
      membershipId = randomUUID();
    const customerId = randomUUID(),
      workdayId = randomUUID(),
      visitId = randomUUID();
    const passwordHash = await new CredentialsService().hashPassword(
      'legacy-password',
    );
    const token = randomBytes(32).toString('base64url');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await db.query(
      'INSERT INTO companies(id,slug,name,time_zone) VALUES($1,$2,$3,$4)',
      [companyId, 'legacy', 'Legacy company', 'America/Lima'],
    );
    await db.query(
      'INSERT INTO users(id,email,password_hash) VALUES($1,$2,$3)',
      [userId, 'legacy@example.com', passwordHash],
    );
    await db.query(
      "INSERT INTO memberships(id,company_id,user_id,role) VALUES($1,$2,$3,'commercial')",
      [membershipId, companyId, userId],
    );
    await db.query(
      "INSERT INTO sessions(token_hash,company_id,membership_id,expires_at) VALUES($1,$2,$3,now()+interval '1 hour')",
      [tokenHash, companyId, membershipId],
    );
    await db.query(
      'INSERT INTO customers(id,company_id,name,address) VALUES($1,$2,$3,$4)',
      [customerId, companyId, 'Historical client', 'Historical street'],
    );
    await db.query(
      'INSERT INTO customer_assignments(company_id,customer_id,membership_id) VALUES($1,$2,$3)',
      [companyId, customerId, membershipId],
    );
    await db.query(
      "INSERT INTO workdays(id,company_id,membership_id,status,started_at,ended_at,business_date) VALUES($1,$2,$3,'completed','2020-01-02T13:00:00Z','2020-01-02T22:00:00Z','2020-01-02')",
      [workdayId, companyId, membershipId],
    );
    await db.query(
      "INSERT INTO visits(id,company_id,membership_id,customer_id,scheduled_at,workday_id,status,arrived_at,ended_at,result,observations) VALUES($1,$2,$3,$4,'2020-01-02T14:00:00Z',$5,'completed','2020-01-02T14:00:00Z','2020-01-02T14:30:00Z','attended','Historical notes')",
      [visitId, companyId, membershipId, customerId, workdayId],
    );
    const image = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=',
      'base64',
    );
    await db.query(
      "INSERT INTO visit_evidence(company_id,membership_id,visit_id,mime_type,content) VALUES($1,$2,$3,'image/png',$4)",
      [companyId, membershipId, visitId, image],
    );
    const receipt = {
      id: workdayId,
      company_id: companyId,
      membership_id: membershipId,
      business_date: '2020-01-02',
      status: 'active',
      started_at: '2020-01-02T13:00:00.000Z',
      ended_at: null,
    };
    const fingerprint = createHash('sha256')
      .update(JSON.stringify(['start_workday', null]))
      .digest('hex');
    await db.query(
      'INSERT INTO operations(company_id,membership_id,key,fingerprint,response) VALUES($1,$2,$3,$4,$5)',
      [
        companyId,
        membershipId,
        'legacy-start',
        fingerprint,
        JSON.stringify(receipt),
      ],
    );
    const before = await Promise.all(
      [
        'users',
        'sessions',
        'visits',
        'visit_evidence',
        'operations',
        'schema_migrations',
      ].map((table) => db.query(`SELECT * FROM ${table} ORDER BY 1`)),
    );
    await prismaMigration(db, ['resolve', '--applied', '0_initial']);
    await migrate(db);
    await migrate(db);
    const after = await Promise.all(
      [
        'users',
        'sessions',
        'visits',
        'visit_evidence',
        'operations',
        'schema_migrations',
      ].map((table) => db.query(`SELECT * FROM ${table} ORDER BY 1`)),
    );
    // The additive audit column must be empty, while every legacy column stays identical.
    const legacyVisits = after[2].map(({ audit, ...legacyVisit }) => {
      assert.equal(audit, null);
      return legacyVisit;
    });
    const legacyUsers = after[0].map(
      ({ display_name, is_platform_owner, ...legacyUser }) => {
        assert.equal(display_name, null);
        assert.equal(is_platform_owner, false);
        return legacyUser;
      },
    );
    assert.deepEqual(
      after.map((rows, index) =>
        index === 2 ? legacyVisits : index === 0 ? legacyUsers : rows,
      ),
      before,
    );
    const [migratedMembership] = await db.query(
      'SELECT can_manage_field_operations FROM memberships WHERE id=$1',
      [membershipId],
    );
    assert.equal(migratedMembership.can_manage_field_operations, false);
    const identity = createIdentity(db);
    const principal = await identity.authenticate(token, 'legacy');
    assert(principal.scope === 'tenant');
    assert.deepEqual(principal.permissions, []);
    const field = createFieldOperations(db);
    assert.equal(
      (await field.currentDay(principal))?.business_date,
      '2020-01-02',
    );
    assert.deepEqual(await field.startDay(principal, 'legacy-start'), receipt);
    assert.deepEqual(await field.evidence(principal, visitId), {
      mimeType: 'image/png',
      base64: image.toString('base64'),
    });
    assert.equal(
      (
        await identity.login({
          company: 'legacy',
          email: 'legacy@example.com',
          password: 'legacy-password',
        })
      ).token.length,
      43,
    );
    const activeId = randomUUID();
    await db.query(
      "INSERT INTO workdays(id,company_id,membership_id,business_date) VALUES($1,$2,$3,'2020-01-03')",
      [activeId, companyId, membershipId],
    );
    await assert.rejects(
      db.query(
        "INSERT INTO workdays(id,company_id,membership_id,business_date) VALUES($1,$2,$3,'2020-01-04')",
        [randomUUID(), companyId, membershipId],
      ),
    );
    await assert.rejects(
      db.query("UPDATE visits SET status='pending' WHERE id=$1", [visitId]),
    );
  } finally {
    await db.close();
  }
});
