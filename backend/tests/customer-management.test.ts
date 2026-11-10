import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { createTestDatabase, assignVisit } from './support';
import { migrate } from './support';
import { provision } from './support';
import { createApp } from '../src/app';

test('customer management requires a live tenant-scoped capability', async () => {
  const db = await createTestDatabase();
  await migrate(db);
  const owner = await provision(
    db,
    'portfolio',
    'Portfolio',
    'owner@example.com',
    'portfolio-password',
  );
  const foreign = await provision(
    db,
    'foreign',
    'Foreign',
    'owner@example.com',
    'portfolio-password',
  );
  const app = await createApp(
    db.prisma,
    false,
    [],
    [
      { host: 'portfolio.example', company: 'portfolio' },
      { host: 'foreign.example', company: 'foreign' },
    ],
  );
  try {
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    const login = await fetch(url + '/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Host': 'portfolio.example',
      },
      body: JSON.stringify({
        email: 'owner@example.com',
        password: 'portfolio-password',
      }),
    });
    const { token } = (await login.json()) as { token: string };
    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Host': 'portfolio.example',
      'Content-Type': 'application/json',
    };
    assert.equal((await fetch(url + '/v1/customers', { headers })).status, 403);
    await db.query(
      'UPDATE memberships SET can_manage_customers=true WHERE id=$1',
      [owner.membershipId],
    );
    assert.equal((await fetch(url + '/v1/customers', { headers })).status, 200);
    const me = (await (await fetch(url + '/v1/me', { headers })).json()) as {
      permissions: string[];
    };
    assert.deepEqual(me.permissions, ['manage_customers']);
    assert.equal(
      (
        await fetch(url + '/v1/customers', {
          headers: { ...headers, 'X-Tenant-Host': 'foreign.example' },
        })
      ).status,
      401,
    );
    await db.query(
      'UPDATE memberships SET can_manage_customers=false WHERE id=$1',
      [owner.membershipId],
    );
    assert.equal(
      (await fetch(url + '/v1/customers/assignees', { headers })).status,
      403,
    );
    const rows = await db.query(
      'SELECT can_manage_customers FROM memberships WHERE id=$1',
      [foreign.membershipId],
    );
    assert.equal(rows[0].can_manage_customers, false);
  } finally {
    await app.close();
    await db.close();
  }
});

test('customer creation persists metadata, enforces tenant uniqueness and rejects invalid assignees', async () => {
  const db = await createTestDatabase();
  await migrate(db);
  const owner = await provision(
    db,
    'creation',
    'Creation',
    'owner@example.com',
    'portfolio-password',
  );
  const foreign = await provision(
    db,
    'foreign',
    'Foreign',
    'owner@example.com',
    'portfolio-password',
  );
  await db.query(
    'UPDATE memberships SET can_manage_customers=true WHERE id=$1',
    [owner.membershipId],
  );
  const app = await createApp(
    db.prisma,
    false,
    [],
    [{ host: 'creation.example', company: 'creation' }],
  );
  try {
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    const auth = await fetch(url + '/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Host': 'creation.example',
      },
      body: JSON.stringify({
        email: 'owner@example.com',
        password: 'portfolio-password',
      }),
    });
    const { token } = (await auth.json()) as { token: string };
    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Host': 'creation.example',
      'Content-Type': 'application/json',
    };
    const input = {
      name: 'Pet Market',
      address: 'Main street 123',
      ruc: '20123456789',
      district: 'San Borja',
      zone: 'Lima Centro',
      commercialMembershipId: owner.membershipId,
    };
    const create = (body: unknown) =>
      fetch(url + '/v1/customers', {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });
    assert.equal(
      (await create({ ...input, companyId: foreign.companyId })).status,
      400,
    );
    assert.equal((await create({ ...input, ruc: '123' })).status, 400);
    assert.equal(
      (await create({ ...input, commercialMembershipId: foreign.membershipId }))
        .status,
      404,
    );
    assert.equal((await db.query('SELECT id FROM customers')).length, 0);
    const response = await create(input);
    assert.equal(response.status, 200);
    const created = (await response.json()) as any;
    assert.equal(created.ruc, input.ruc);
    assert.equal(created.district, input.district);
    assert.equal(created.zone, input.zone);
    assert.equal(created.condition, null);
    assert.equal(created.lastPurchaseDate, null);
    assert.equal(created.assignments[0].membershipId, owner.membershipId);
    assert.equal((await create(input)).status, 409);
    assert.equal((await db.query('SELECT id FROM customers')).length, 1);
    await db.query(
      'INSERT INTO customers(id,company_id,name,address,ruc) VALUES($1,$2,$3,$4,$5)',
      [
        randomUUID(),
        foreign.companyId,
        'Foreign client',
        'Foreign address',
        input.ruc,
      ],
    );
    const portfolio = (await (
      await fetch(url + '/v1/customers', { headers })
    ).json() as any).items as any[];
    assert.equal(portfolio.length, 1);
    assert.equal(portfolio[0].id, created.id);

    const importRes = await fetch(url + '/v1/customers/import', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        items: [
          {
            name: 'Duplicate RUC Client',
            address: 'Some street 1',
            ruc: input.ruc,
            district: 'San Borja',
            zone: 'Lima Centro',
          },
          {
            name: 'Imported Client A',
            address: 'Av. Larco 500',
            ruc: '20456789012',
            district: 'Miraflores',
            zone: 'Lima Centro',
          },
          {
            name: 'Imported Client B (Same RUC in batch)',
            address: 'Av. Larco 502',
            ruc: '20456789012',
            district: 'Miraflores',
            zone: 'Lima Centro',
          },
        ],
      }),
    });
    assert.equal(importRes.status, 200);
    assert.deepEqual(await importRes.json(), { imported: 1, skipped: 2 });
    const afterImport = (await (
      await fetch(url + '/v1/customers', { headers })
    ).json() as any).items as any[];
    assert.equal(afterImport.length, 2);
    const mine = (await (
      await fetch(url + '/v1/me/customers', { headers })
    ).json() as any).items as any[];
    assert.deepEqual(mine, [
      { id: created.id, name: input.name, address: input.address },
    ]);
  } finally {
    await app.close();
    await db.close();
  }
});

test('bulk assignment is atomic and preserves other-role assignments and historical visits', async () => {
  const db = await createTestDatabase();
  await migrate(db);
  const owner = await provision(
    db,
    'assignment',
    'Assignment',
    'owner@example.com',
    'portfolio-password',
  );
  const foreign = await provision(
    db,
    'foreign',
    'Foreign',
    'owner@example.com',
    'portfolio-password',
  );
  const member = async (role: 'commercial' | 'merchandiser', active = true) => {
    const userId = randomUUID();
    const membershipId = randomUUID();
    await db.query(
      'INSERT INTO users(id,email,password_hash) SELECT $1,$2,password_hash FROM users WHERE id=$3',
      [userId, `${userId}@example.com`, owner.userId],
    );
    await db.query(
      'INSERT INTO memberships(id,company_id,user_id,role,active) VALUES($1,$2,$3,$4,$5)',
      [membershipId, owner.companyId, userId, role, active],
    );
    return membershipId;
  };
  const commercial = await member('commercial');
  const merchandiser = await member('merchandiser');
  const inactive = await member('commercial', false);
  const { customer, visit } = await assignVisit(db, owner);
  const { customer: foreignCustomer } = await assignVisit(db, foreign);
  await db.query(
    'INSERT INTO customer_assignments(company_id,customer_id,membership_id) VALUES($1,$2,$3)',
    [owner.companyId, customer.id, merchandiser],
  );
  await db.query(
    'UPDATE memberships SET can_manage_customers=true WHERE id=$1',
    [owner.membershipId],
  );
  const app = await createApp(
    db.prisma,
    false,
    [],
    [{ host: 'assignment.example', company: 'assignment' }],
  );
  try {
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    const login = await fetch(url + '/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Host': 'assignment.example',
      },
      body: JSON.stringify({
        email: 'owner@example.com',
        password: 'portfolio-password',
      }),
    });
    const { token } = (await login.json()) as { token: string };
    const headers = {
      Authorization: `Bearer ${token}`,
      'X-Tenant-Host': 'assignment.example',
      'Content-Type': 'application/json',
    };
    const assign = (customerIds: string[], membershipId: string) =>
      fetch(url + '/v1/customers/assignments', {
        method: 'POST',
        headers,
        body: JSON.stringify({ customerIds, membershipId }),
      });
    const snapshot = () =>
      db.query(
        'SELECT * FROM customer_assignments ORDER BY customer_id,membership_id',
      );
    const before = await snapshot();
    assert.equal(
      (await assign([customer.id], foreign.membershipId)).status,
      404,
    );
    assert.equal((await assign([customer.id], inactive)).status, 404);
    assert.equal(
      (await assign([customer.id, foreignCustomer.id], commercial)).status,
      404,
    );
    assert.deepEqual(await snapshot(), before);
    assert.equal(
      (await assign([customer.id, customer.id], commercial)).status,
      400,
    );
    const assigned = await assign([customer.id], commercial);
    assert.equal(assigned.status, 200);
    assert.deepEqual(await assigned.json(), { updated: 1 });
    const ownAssignments = await db.query(
      'SELECT membership_id FROM customer_assignments WHERE customer_id=$1 ORDER BY membership_id',
      [customer.id],
    );
    assert.deepEqual(
      ownAssignments.map((row) => row.membership_id).sort(),
      [commercial, merchandiser].sort(),
    );
    const history = await db.query(
      'SELECT membership_id FROM visits WHERE id=$1',
      [visit.id],
    );
    assert.equal(history[0].membership_id, owner.membershipId);
    assert.deepEqual(
      (await (await fetch(url + '/v1/me/customers', { headers })).json() as any).items,
      [],
    );
    const eligible = (await (
      await fetch(url + '/v1/customers/assignees', { headers })
    ).json() as any).items as any[];
    assert.ok(eligible.some((row) => row.id === merchandiser));
    assert.ok(
      !eligible.some(
        (row) => row.id === inactive || row.id === foreign.membershipId,
      ),
    );
    const portfolio = (await (
      await fetch(url + '/v1/customers', { headers })
    ).json() as any).items as any[];
    assert.equal(portfolio[0].assignments.length, 2);
  } finally {
    await app.close();
    await db.close();
  }
});
