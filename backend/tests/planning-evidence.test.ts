import { test } from 'node:test';
import assert from 'node:assert/strict';

import { randomUUID } from 'node:crypto';
import { createTestDatabase, assignVisit } from './support';
import { migrate } from './support';
import { provision } from './support';
import { createApp } from '../src/app';

test('self planning and real evidence survive reload, reject unauthorized input and roll back failed writes', async () => {
  const db = await createTestDatabase();
  await migrate(db);
  const owner = await provision(
    db,
    'planning',
    'Planning',
    'owner@example.com',
    'long-test-password',
    'America/Lima',
  );
  const foreign = await provision(
    db,
    'foreign',
    'Foreign',
    'foreign@example.com',
    'long-test-password',
  );
  const { customer, visit } = await assignVisit(db, owner);
  const other = await assignVisit(db, foreign);
  const addMember = async (email: string, role: string) => {
    const userId = randomUUID(),
      membershipId = randomUUID();
    await db.query(
      'INSERT INTO users(id,email,password_hash) SELECT $1,$2,password_hash FROM users WHERE id=$3',
      [userId, email, owner.userId],
    );
    await db.query(
      'INSERT INTO memberships(id,company_id,user_id,role) VALUES($1,$2,$3,$4)',
      [membershipId, owner.companyId, userId, role],
    );
    return { companyId: owner.companyId, membershipId };
  };
  const colleague = await addMember('colleague@example.com', 'commercial');
  const unassigned = await assignVisit(db, colleague);
  await addMember('merch@example.com', 'merchandiser');
  const app = await createApp(
    db.prisma,
    false,
    [],
    [
      { host: 'planning.example', company: 'planning' },
      { host: 'foreign.example', company: 'foreign' },
    ],
  );
  try {
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    let token = '',
      host = 'planning.example';
    const call = async (path: string, body?: unknown, key?: string) => {
      const response = await fetch(url + '/v1' + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Host': host,
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(key ? { 'Idempotency-Key': key } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      assert.ok(response.headers.get('x-request-id'));
      return { status: response.status, body: (await response.json()) as any };
    };
    const login = async (email = 'owner@example.com') => {
      token = (
        await call('/auth/login', { email, password: 'long-test-password' })
      ).body.token;
    };
    await login();
    const me = (await call('/me')).body;
    assert.equal(me.email, 'owner@example.com');
    assert.equal(me.timeZone, 'America/Lima');
    assert.deepEqual((await call('/me/workdays')).body.items, []);
    const scheduledAt = new Date(Date.now() + 86400000).toISOString();
    const input = { customerId: customer.id, scheduledAt };
    const plan = await call('/me/visits', input, 'plan');
    assert.equal(plan.status, 200);
    assert.equal(plan.body.customer_id, customer.id);
    assert.deepEqual((await call('/me/visits', input, 'plan')).body, plan.body);
    assert.equal(
      (await call('/me/agenda')).body.items.find(
        (entry: any) => entry.id === plan.body.id,
      ).status,
      'pending',
    );
    assert.equal(
      (await call('/me/agenda')).body.items.find(
        (entry: any) => entry.id === plan.body.id,
      ).has_evidence,
      false,
    );
    const snapshot = async () =>
      Promise.all(
        ['visits', 'operations', 'audit_log'].map((table) =>
          db.query(`SELECT * FROM ${table} ORDER BY 1,2`),
        ),
      );
    const before = await snapshot();
    for (const customerId of [
      randomUUID(),
      other.customer.id,
      unassigned.customer.id,
    ]) {
      const rejected = await call(
        '/me/visits',
        { ...input, customerId },
        randomUUID(),
      );
      assert.equal(rejected.status, 404);
      assert.equal(rejected.body.code, 'customer_not_assigned');
    }
    assert.equal(
      (await call('/me/visits', input, 'duplicate')).body.code,
      'visit_slot_taken',
    );
    assert.equal(
      (
        await call(
          '/me/visits',
          {
            ...input,
            scheduledAt: new Date(Date.now() + 172800000).toISOString(),
          },
          'plan',
        )
      ).body.code,
      'idempotency_key_reused',
    );
    assert.equal(
      (
        await call(
          '/me/visits',
          { ...input, membershipId: colleague.membershipId },
          'inject',
        )
      ).status,
      400,
    );
    assert.deepEqual(await snapshot(), before);
    host = 'foreign.example';
    assert.equal(
      (await call('/me/visits', input, 'foreign-domain')).status,
      401,
    );
    host = 'planning.example';
    await login('merch@example.com');
    assert.equal(
      (await call('/me/visits', input, 'role')).body.code,
      'planning_forbidden',
    );
    await login();
    const path = `/me/visits/${visit.id}`;
    assert.equal((await call(path + '/evidence')).body, null);
    assert.equal((await call('/me/workdays/start', {}, 'start')).status, 200);
    assert.equal((await call(path + '/check-in', {}, 'arrive')).status, 200);
    const close = { result: 'attended', observations: 'Real selected image' };
    const image = {
      mimeType: 'image/png',
      base64:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=',
    };
    const imageBytes = Buffer.alloc(1048577);
    Buffer.from(image.base64, 'base64').copy(imageBytes);
    const activeState = await snapshot();
    const tooLarge = await call(
      path + '/close',
      { ...close, attachment: { ...image, base64: 'A'.repeat(1500000) } },
      'payload-too-large',
    );
    assert.equal(tooLarge.status, 413);
    assert.equal(tooLarge.body.code, 'payload_too_large');
    assert.deepEqual(await snapshot(), activeState);
    for (const attachment of [
      { ...image, base64: 'invalid=' },
      { ...image, base64: image.base64 + '\n' },
      { ...image, mimeType: 'image/jpeg' },
      {
        mimeType: 'image/svg+xml',
        base64: Buffer.from('<svg/>').toString('base64'),
      },
      { ...image, base64: imageBytes.toString('base64') },
    ]) {
      const rejected = await call(
        path + '/close',
        { ...close, attachment },
        randomUUID(),
      );
      assert.equal(rejected.status, 400);
      assert.equal(rejected.body.code, 'invalid_evidence');
      assert.deepEqual(await snapshot(), activeState);
      assert.equal((await call(path + '/evidence')).body, null);
    }
    await db.query(
      "CREATE FUNCTION reject_test_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.action='close_visit' THEN RAISE EXCEPTION 'test audit failure'; END IF; RETURN NEW; END $$",
    );
    await db.query(
      'CREATE TRIGGER reject_test_audit BEFORE INSERT ON audit_log FOR EACH ROW EXECUTE FUNCTION reject_test_audit()',
    );
    // The exact upper bound must pass transport validation, then roll back on audit failure.
    assert.equal(
      (
        await call(
          path + '/close',
          {
            ...close,
            attachment: {
              ...image,
              base64: imageBytes.subarray(0, 1048576).toString('base64'),
            },
          },
          'max-image',
        )
      ).status,
      500,
    );
    assert.deepEqual(await snapshot(), activeState);
    assert.equal((await call(path + '/evidence')).body, null);
    assert.equal(
      (await call(path + '/close', { ...close, attachment: image }, 'atomic'))
        .status,
      500,
    );
    assert.deepEqual(await snapshot(), activeState);
    assert.equal((await call(path + '/evidence')).body, null);
    await db.query('DROP TRIGGER reject_test_audit ON audit_log');
    const completed = await call(
      path + '/close',
      { ...close, attachment: image },
      'atomic',
    );
    assert.equal(completed.status, 200);
    assert.equal(completed.body.status, 'completed');
    assert.deepEqual(
      (await call(path + '/close', { ...close, attachment: image }, 'atomic'))
        .body,
      completed.body,
    );
    assert.equal(
      (await call(path + '/close', close, 'atomic')).body.code,
      'idempotency_key_reused',
    );
    await login();
    assert.deepEqual((await call(path + '/evidence')).body, image);
    assert.equal(
      (await call('/me/agenda')).body.items.find(
        (entry: any) => entry.id === visit.id,
      ).has_evidence,
      true,
    );
    await login('colleague@example.com');
    assert.equal((await call(path + '/evidence')).status, 404);
    assert.deepEqual((await call('/me/workdays')).body.items, []);
    await login();
    assert.equal((await call('/me/workdays/end', {}, 'end')).status, 200);
    assert.deepEqual((await call('/me/workdays')).body.items, [
      (await call('/me/workday')).body,
    ]);
    const late = await call(
      '/me/visits',
      { customerId: customer.id, scheduledAt: new Date().toISOString() },
      'late',
    );
    assert.equal(late.body.code, 'workday_already_started');
    assert.equal(
      (
        await call(
          '/me/visits',
          {
            customerId: customer.id,
            scheduledAt: new Date(Date.now() + 172800000).toISOString(),
          },
          'future',
        )
      ).status,
      200,
    );
  } finally {
    await app.close();
    await db.close();
  }
});
