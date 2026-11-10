import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHash, randomUUID } from 'node:crypto';
import { createTestDatabase, migrate, provision, assignVisit } from './support';
import { createApp } from '../src/app';

test('two managers assign one role atomically while rejected commands preserve full database state', async () => {
  const db = await createTestDatabase();
  const fork = db.fork();
  let appA: Awaited<ReturnType<typeof createApp>> | undefined;
  let appB: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const owner = await provision(
      db,
      'assignment-race',
      'Assignment race',
      'manager@example.com',
      'test-password',
    );
    const foreign = await provision(
      db,
      'foreign',
      'Foreign',
      'foreign@example.com',
      'test-password',
    );
    const member = async (
      role: 'commercial' | 'merchandiser',
      manager = false,
    ) => {
      const userId = randomUUID(),
        id = randomUUID(),
        email = `${userId}@example.com`;
      await db.query(
        'INSERT INTO users(id,email,password_hash) SELECT $1,$2,password_hash FROM users WHERE id=$3',
        [userId, email, owner.userId],
      );
      await db.query(
        'INSERT INTO memberships(id,company_id,user_id,role,can_manage_customers) VALUES($1,$2,$3,$4,$5)',
        [id, owner.companyId, userId, role, manager],
      );
      return { id, email };
    };
    const managerB = await member('commercial', true);
    const targetA = await member('commercial');
    const targetB = await member('commercial');
    const merchandiser = await member('merchandiser');
    await db.query(
      'UPDATE memberships SET can_manage_customers=true WHERE id=$1',
      [owner.membershipId],
    );
    const { customer, visit } = await assignVisit(db, owner);
    const foreignVisit = await assignVisit(db, foreign);
    await db.query(
      'INSERT INTO customer_assignments(company_id,customer_id,membership_id) VALUES($1,$2,$3)',
      [owner.companyId, customer.id, merchandiser.id],
    );
    const domains = [
      { host: 'assignment-race.example', company: 'assignment-race' },
    ];
    appA = await createApp(db.prisma, false, [], domains);
    appB = await createApp(fork.prisma, false, [], domains);
    await appA.listen(0, '127.0.0.1');
    await appB.listen(0, '127.0.0.1');
    const urlA = await appA.getUrl(),
      urlB = await appB.getUrl();
    const headers = (token: string) => ({
      'Content-Type': 'application/json',
      'X-Tenant-Host': 'assignment-race.example',
      Authorization: `Bearer ${token}`,
    });
    const post = (url: string, token: string, path: string, body: unknown) =>
      fetch(url + '/v1/' + path, {
        method: 'POST',
        headers: headers(token),
        body: JSON.stringify(body),
      });
    const login = async (url: string, email: string): Promise<string> => {
      const response = await post(url, '', 'auth/login', {
        email,
        password: 'test-password',
      });
      assert.equal(response.status, 200);
      return ((await response.json()) as { token: string }).token;
    };
    const tokenA = await login(urlA, 'manager@example.com');
    const tokenB = await login(urlB, managerB.email);
    const snapshot = async (): Promise<string> => {
      const rows = [];
      for (const table of [
        'companies',
        'users',
        'memberships',
        'sessions',
        'customers',
        'customer_assignments',
        'visits',
        'workdays',
        'operations',
        'audit_log',
        'visit_evidence',
      ]) {
        rows.push([
          table,
          await db.query(`SELECT * FROM ${table} ORDER BY 1,2,3`),
        ]);
      }
      return createHash('sha256').update(JSON.stringify(rows)).digest('hex');
    };
    const before = await snapshot();
    const rejected: { path: string; body: unknown; status: number }[] = [
      {
        path: 'customers/assignments',
        body: {
          customerIds: [customer.id],
          membershipId: foreign.membershipId,
        },
        status: 404,
      },
      {
        path: 'customers/assignments',
        body: {
          customerIds: [customer.id, foreignVisit.customer.id],
          membershipId: targetA.id,
        },
        status: 404,
      },
      {
        path: 'customers/assignments',
        body: {
          customerIds: [customer.id],
          membershipId: targetA.id,
          companyId: foreign.companyId,
        },
        status: 400,
      },
      {
        path: 'customers',
        body: {
          name: 'Wrong role',
          address: 'Street',
          ruc: '20123456789',
          district: 'District',
          commercialMembershipId: merchandiser.id,
        },
        status: 404,
      },
    ];
    for (const command of rejected) {
      const response = await post(urlA, tokenA, command.path, command.body);
      assert.equal(response.status, command.status, await response.text());
      assert.equal(
        await snapshot(),
        before,
        'Rejected command changed database state',
      );
    }
    for (let attempt = 0; attempt < 5; attempt++) {
      const responses = await Promise.all([
        post(urlA, tokenA, 'customers/assignments', {
          customerIds: [customer.id],
          membershipId: targetA.id,
        }),
        post(urlB, tokenB, 'customers/assignments', {
          customerIds: [customer.id],
          membershipId: targetB.id,
        }),
      ]);
      assert.deepEqual(
        responses.map((response) => response.status),
        [200, 200],
      );
      for (const response of responses)
        assert.deepEqual(await response.json(), { updated: 1 });
      const assignments = await db.query(
        'SELECT ca.membership_id,m.role FROM customer_assignments ca JOIN memberships m ON m.id=ca.membership_id WHERE customer_id=$1',
        [customer.id],
      );
      assert.equal(
        assignments.filter((assignment) => assignment.role === 'commercial')
          .length,
        1,
      );
      assert.equal(
        assignments.find((assignment) => assignment.role === 'merchandiser')
          ?.membership_id,
        merchandiser.id,
      );
    }
    assert.equal(
      (
        await db.query('SELECT membership_id FROM visits WHERE id=$1', [
          visit.id,
        ])
      )[0].membership_id,
      owner.membershipId,
    );
  } finally {
    if (appB) await appB.close();
    if (appA) await appA.close();
    await fork.close();
    await db.close();
  }
});
