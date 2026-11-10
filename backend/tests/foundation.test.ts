import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createTestDatabase, assignVisit } from './support';
import { migrate } from './support';
import { createIdentity, provision } from './support';
import { createFieldOperations } from './support';

test('tenant isolation, session lifecycle and complete basic field flow', async () => {
  const database = await createTestDatabase();
  try {
    await migrate(database);
    await migrate(database);
    const a = await provision(
      database,
      'alpha',
      'Alpha',
      'seller@example.com',
      'long-password-123',
    );
    const b = await provision(
      database,
      'beta',
      'Beta',
      'other@example.com',
      'other-password-123',
    );
    const identity = createIdentity(database);
    const field = createFieldOperations(database);
    const login = await identity.login({
      company: 'alpha',
      email: 'seller@example.com',
      password: 'long-password-123',
    });
    const principal = await identity.authenticate(login.token);
    assert(principal.scope === 'tenant');
    const second = await identity.login({
      company: 'beta',
      email: 'other@example.com',
      password: 'other-password-123',
    });
    const outsider = await identity.authenticate(second.token);
    assert(outsider.scope === 'tenant');
    await assert.rejects(
      identity.login({
        company: 'beta',
        email: 'seller@example.com',
        password: 'long-password-123',
      }),
    );
    const { customer, visit } = await assignVisit(database, a);
    assert.equal((await field.customers(outsider)).items.length, 0);
    await assert.rejects(field.checkIn(outsider, 'steal', visit.id));
    await assert.rejects(field.checkIn(principal, 'no-day', visit.id));
    const day = await field.startDay(principal, 'day-1');
    assert.deepEqual(await field.startDay(principal, 'day-1'), day);
    await assert.rejects(field.endDay(principal, 'early-end'));
    await assert.rejects(
      field.closeVisit(principal, 'early-close', visit.id, {
        result: 'attended',
        observations: '',
      }),
    );
    await field.checkIn(principal, 'arrive-1', visit.id);
    const finished = await field.closeVisit(principal, 'close-1', visit.id, {
      result: 'attended',
      observations: '  done  ',
    });
    assert.equal(finished.status, 'completed');
    assert.equal(finished.observations, 'done');
    assert.deepEqual(
      await field.closeVisit(principal, 'close-1', visit.id, {
        result: 'attended',
        observations: '  done  ',
      }),
      finished,
    );
    await assert.rejects(
      field.closeVisit(principal, 'close-1', visit.id, {
        result: 'closed',
        observations: '',
      }),
    );
    await field.endDay(principal, 'end-1');
    assert.equal((await field.currentDay(principal))?.status, 'completed');
    await assert.rejects(
      database.query(
        'INSERT INTO visits(id,company_id,membership_id,customer_id,scheduled_at) VALUES($1,$2,$3,$4,now())',
        [crypto.randomUUID(), b.companyId, b.membershipId, customer.id],
      ),
    );
    await identity.logout(principal);
    await assert.rejects(identity.authenticate(login.token));
    assert.ok(a.companyId !== b.companyId);
  } finally {
    await database.close();
  }
});
