import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import {
  createTestDatabase,
  migrate,
  createIdentity,
  createFieldOperations,
  provision,
  assignVisit,
} from './support';
import { createApp } from '../src/app';

test('real PostgreSQL pools serialize concurrent requests and preserve tenant isolation', async () => {
  const a = await createTestDatabase();
  const b = a.fork();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(a);
    const owner = await provision(
      a,
      'concurrent',
      'Concurrent',
      'concurrent@example.com',
      'long-test-password',
      'America/Lima',
    );
    const outsider = await provision(
      a,
      'outside',
      'Outside',
      'outside@example.com',
      'long-test-password',
    );
    const identity = createIdentity(a);
    const token = (
      await identity.login({
        company: 'concurrent',
        email: 'concurrent@example.com',
        password: 'long-test-password',
      })
    ).token;
    const p = await identity.authenticate(token);
    assert(p.scope === 'tenant');
    const q = await identity.authenticate(
      (
        await identity.login({
          company: 'outside',
          email: 'outside@example.com',
          password: 'long-test-password',
        })
      ).token,
    );
    assert(q.scope === 'tenant');
    const first = await assignVisit(a, owner),
      second = await assignVisit(a, owner);
    const fieldA = createFieldOperations(a),
      fieldB = createFieldOperations(b);
    const planningInput = {
      customerId: first.customer.id,
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    };
    const planning = await Promise.allSettled([
      fieldA.scheduleVisit(p, 'plan-a', planningInput),
      fieldB.scheduleVisit(p, 'plan-b', planningInput),
    ]);
    assert.equal(
      planning.filter((result) => result.status === 'fulfilled').length,
      1,
    );
    const planKey = planning[0].status === 'fulfilled' ? 'plan-a' : 'plan-b';
    assert.deepEqual(
      await fieldA.scheduleVisit(p, planKey, planningInput),
      await fieldB.scheduleVisit(p, planKey, planningInput),
    );
    await assert.rejects(
      fieldB.scheduleVisit(q, 'foreign-plan', planningInput),
    );
    const days = await Promise.allSettled([
      fieldA.startDay(p, 'day-a'),
      fieldB.startDay(p, 'day-b'),
    ]);
    assert.equal(
      days.filter((result) => result.status === 'fulfilled').length,
      1,
    );
    assert.equal((await a.query('SELECT * FROM workdays')).length, 1);
    const winningKey = days[0].status === 'fulfilled' ? 'day-a' : 'day-b';
    const [replayA, replayB] = await Promise.all([
      fieldA.startDay(p, winningKey),
      fieldB.startDay(p, winningKey),
    ]);
    assert.deepEqual(replayA, replayB);
    assert.match(replayA.business_date, /^\d{4}-\d{2}-\d{2}$/);
    const arrivals = await Promise.allSettled([
      fieldA.checkIn(p, 'arrive-a', first.visit.id),
      fieldB.checkIn(p, 'arrive-b', second.visit.id),
    ]);
    assert.equal(
      arrivals.filter((result) => result.status === 'fulfilled').length,
      1,
    );
    assert.equal(
      (await a.query("SELECT * FROM visits WHERE status='active'")).length,
      1,
    );
    assert.equal((await fieldB.agenda(q)).items.length, 0);
    const before = await a.query('SELECT * FROM operations ORDER BY key');
    await assert.rejects(fieldB.checkIn(q, 'foreign', first.visit.id));
    assert.deepEqual(
      await a.query('SELECT * FROM operations ORDER BY key'),
      before,
    );
    const active =
      arrivals[0].status === 'fulfilled' ? first.visit.id : second.visit.id;
    const pending =
      active === first.visit.id ? second.visit.id : first.visit.id;
    const attachment = {
      mimeType: 'image/png',
      base64:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a9X8AAAAASUVORK5CYII=',
    };
    await fieldA.closeVisit(p, 'close-active', active, {
      result: 'attended',
      observations: '',
      attachment,
    });
    assert.deepEqual(await fieldB.evidence(p, active), attachment);
    await assert.rejects(fieldB.evidence(q, active));
    await fieldB.checkIn(p, 'arrive-pending', pending);
    await fieldB.closeVisit(p, 'close-pending', pending, {
      result: 'unavailable',
      observations: '',
    });
    await fieldA.endDay(p, 'end');
    app = await createApp(
      b.prisma,
      false,
      [],
      [{ host: 'concurrent.example', company: 'concurrent' }],
    );
    await app.listen(0, '127.0.0.1');
    const response = await fetch((await app.getUrl()) + '/v1/me/workday', {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Tenant-Host': 'concurrent.example',
      },
    });
    assert.equal(response.status, 200);
    const body = (await response.json()) as any;
    assert.equal(body.status, 'completed');
    assert.match(body.business_date, /^\d{4}-\d{2}-\d{2}$/);
    await assert.rejects(
      a.query(
        'INSERT INTO visits(id,company_id,membership_id,customer_id,scheduled_at) VALUES($1,$2,$3,$4,now())',
        [
          randomUUID(),
          outsider.companyId,
          outsider.membershipId,
          first.customer.id,
        ],
      ),
    );
  } finally {
    if (app) await app.close();
    await b.close();
    await a.close();
  }
});
