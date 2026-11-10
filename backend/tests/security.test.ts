import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

import { createTestDatabase, assignVisit } from './support';
import { migrate } from './support';
import { createIdentity, provision } from './support';
import { createFieldOperations } from './support';

test('shared identity uses independent memberships; unassigned and expired sessions cannot change data', async () => {
  const db = await createTestDatabase();
  try {
    await migrate(db);
    const a = await provision(
      db,
      'one',
      'One',
      'shared@example.com',
      'long-test-password',
    );
    const b = await provision(
      db,
      'two',
      'Two',
      'shared@example.com',
      'long-test-password',
    );
    assert.equal(a.userId, b.userId);
    const identity = createIdentity(db),
      field = createFieldOperations(db);
    const p = await identity.authenticate(
      (
        await identity.login({
          company: 'one',
          email: 'shared@example.com',
          password: 'long-test-password',
        })
      ).token,
    );
    const q = await identity.authenticate(
      (
        await identity.login({
          company: 'two',
          email: 'shared@example.com',
          password: 'long-test-password',
        })
      ).token,
    );
    assert(p.scope === 'tenant');
    assert(q.scope === 'tenant');
    const { visit } = await assignVisit(db, a);
    const otherId = randomUUID(),
      otherUser = randomUUID();
    await db.query(
      'INSERT INTO users(id,email,password_hash) SELECT $1,$2,password_hash FROM users WHERE id=$3',
      [otherUser, 'other@one.example', a.userId],
    );
    await db.query(
      "INSERT INTO memberships(id,company_id,user_id,role) VALUES($1,$2,$3,'merchandiser')",
      [otherId, a.companyId, otherUser],
    );
    const other = await identity.authenticate(
      (
        await identity.login({
          company: 'one',
          email: 'other@one.example',
          password: 'long-test-password',
        })
      ).token,
    );
    assert(other.scope === 'tenant');
    for (const actor of [q, other]) {
      assert.equal((await field.agenda(actor)).items.length, 0);
      assert.equal((await field.customers(actor)).items.length, 0);
      await assert.rejects(field.checkIn(actor, 'attempt', visit.id));
      await assert.rejects(
        field.closeVisit(actor, 'attempt-close', visit.id, {
          result: 'attended',
          observations: '',
        }),
      );
    }
    assert.equal((await db.query('SELECT * FROM operations')).length, 0);
    assert.equal((await db.query('SELECT * FROM audit_log')).length, 0);
    assert.equal(
      (await db.query('SELECT status FROM visits WHERE id=$1', [visit.id]))[0]
        .status,
      'pending',
    );
    await db.query(
      "UPDATE sessions SET expires_at=now()-interval '1 second' WHERE token_hash=$1",
      [p.tokenHash],
    );
    await assert.rejects(field.startDay(p, 'expired'));
    await db.query('UPDATE memberships SET active=false WHERE id=$1', [
      q.membershipId,
    ]);
    await assert.rejects(field.startDay(q, 'disabled'));
  } finally {
    await db.close();
  }
});

test('transition rejection preserves data; future visits do not block today and duplicate commands are serialized', async () => {
  const db = await createTestDatabase();
  try {
    await migrate(db);
    const owner = await provision(
      db,
      'calendar',
      'Calendar',
      'calendar@example.com',
      'long-test-password',
      'America/Lima',
    );
    const identity = createIdentity(db),
      field = createFieldOperations(db);
    const p = await identity.authenticate(
      (
        await identity.login({
          company: 'calendar',
          email: 'calendar@example.com',
          password: 'long-test-password',
        })
      ).token,
    );
    assert(p.scope === 'tenant');
    const first = await assignVisit(db, owner),
      second = await assignVisit(db, owner);
    const future = await assignVisit(
      db,
      owner,
      new Date(Date.now() + 86400000 * 3).toISOString(),
    );
    const days = await Promise.all([
      field.startDay(p, 'start'),
      field.startDay(p, 'start'),
    ]);
    assert.deepEqual(days[0], days[1]);
    assert.equal((await db.query('SELECT * FROM workdays')).length, 1);
    await assert.rejects(field.startDay(p, 'other-start'));
    await assert.rejects(field.checkIn(p, 'future', future.visit.id));
    await field.checkIn(p, 'arrive', first.visit.id);
    await assert.rejects(field.checkIn(p, 'two-active', second.visit.id));
    assert.throws(() =>
      field.closeVisit(p, 'invalid', first.visit.id, {
        result: 'ordered',
        observations: '',
      }),
    );
    assert.equal(
      (
        await db.query('SELECT status FROM visits WHERE id=$1', [
          first.visit.id,
        ])
      )[0].status,
      'active',
    );
    await field.closeVisit(p, 'close', first.visit.id, {
      result: 'closed',
      observations: '',
    });
    await field.checkIn(p, 'arrive-second', second.visit.id);
    await field.closeVisit(p, 'close-second', second.visit.id, {
      result: 'unavailable',
      observations: '',
    });
    await field.endDay(p, 'end');
    await assert.rejects(field.startDay(p, 'restart-same-day'));
    assert.equal(
      (
        await db.query('SELECT status FROM visits WHERE id=$1', [
          future.visit.id,
        ])
      )[0].status,
      'pending',
    );
  } finally {
    await db.close();
  }
});

test('login lockout persists and tokens are stored only as hashes', async () => {
  const db = await createTestDatabase();
  try {
    await migrate(db);
    await provision(
      db,
      'locked',
      'Locked',
      'locked@example.com',
      'long-test-password',
    );
    const identity = createIdentity(db);
    for (let i = 0; i < 5; i++)
      await assert.rejects(
        identity.login({
          company: 'locked',
          email: 'locked@example.com',
          password: 'wrong-password-123',
        }),
      );
    await assert.rejects(
      identity.login({
        company: 'locked',
        email: 'locked@example.com',
        password: 'long-test-password',
      }),
    );
    await db.query("UPDATE users SET blocked_until=now()-interval '1 second'");
    const session = await identity.login({
      company: 'locked',
      email: 'locked@example.com',
      password: 'long-test-password',
    });
    const [stored] = await db.query('SELECT token_hash FROM sessions');
    assert.notEqual(stored.token_hash, session.token);
    assert.equal(stored.token_hash.length, 64);
    assert.ok(
      !(
        await db.query('SELECT password_hash FROM users')
      )[0].password_hash.includes('long-test-password'),
    );
  } finally {
    await db.close();
  }
});
