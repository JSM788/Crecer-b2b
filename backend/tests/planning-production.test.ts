import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, migrate } from './support';
import { createApp } from '../src/app';
import { OperatorService } from '../src/modules/identity/services/operator.service';
import { CredentialsService } from '../src/modules/identity/services/credentials.service';

test('planning versions, frozen workdays and historical roles hold through public HTTP commands', async () => {
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const operator = new OperatorService(db.prisma, new CredentialsService());
    const manager = await operator.provision('production', 'Production', 'manager@test.example', 'long-test-password', 'America/Lima', 'manager');
    const commercial = await operator.addMember(manager.companyId, 'commercial@test.example', 'long-test-password', 'commercial');
    const raceMember = await operator.addMember(manager.companyId, 'race@test.example', 'long-test-password', 'commercial');
    const foreign = await operator.provision('foreign', 'Foreign', 'foreign@test.example', 'long-test-password');
    const customer = await db.prisma.customer.create({ data: {
      companyId: manager.companyId, name: 'Planning customer', address: 'Address',
    } });
    await db.prisma.customerAssignment.createMany({ data: [commercial, raceMember].map((member) => ({
      companyId: manager.companyId, customerId: customer.id, membershipId: member.membershipId,
    })) });
    app = await createApp(db.prisma, false, [], [{ host: 'production.example', company: 'production' }, { host: 'foreign.example', company: 'foreign' }]);
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const call = async (token: string, path: string, body?: unknown, key: string = randomUUID(), host = 'production.example') => {
      const response = await fetch(base + '/v1' + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant-Host': host,
          ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Idempotency-Key': key },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() as any };
    };
    const login = async (email: string, host = 'production.example') => (await call('', '/auth/login', { email, password: 'long-test-password' }, randomUUID(), host)).body.token as string;
    const managerToken = await login('manager@test.example');
    const workerToken = await login('commercial@test.example');
    const raceToken = await login('race@test.example');
    const now = new Date().toISOString();
    const future = new Date(Date.now() + 2 * 86400000).toISOString();
    const scheduled = await call(managerToken, '/field-operations/visits', { customerId: customer.id, membershipId: commercial.membershipId, scheduledAt: now });
    assert.equal(scheduled.status, 200);
    assert.equal(scheduled.body.planned_role, 'commercial');
    assert.equal(scheduled.body.execution_role, null);
    assert.equal(scheduled.body.version, 0);
    const id = scheduled.body.id;
    const changed = await call(managerToken, `/field-operations/visits/${id}/reschedule`, { scheduledAt: now, expectedVersion: 0 });
    assert.equal(changed.status, 200);
    assert.equal(changed.body.version, 1);
    const changeAudit = await db.prisma.auditEntry.findFirstOrThrow({ where: { subjectId: id, action: 'reschedule_team_visit' } });
    assert.deepEqual(changeAudit.details, { previousScheduledAt: now, scheduledAt: now, previousVersion: 0, version: 1 });
    const persisted = async () => ({
      visit: await db.prisma.visit.findUnique({ where: { id } }),
      receipts: await db.prisma.operation.count(), audit: await db.prisma.auditEntry.count(),
    });
    const beforeStale = await persisted();
    const stale = await call(managerToken, `/field-operations/visits/${id}/cancel`, { expectedVersion: 0 });
    assert.equal(stale.status, 409);
    assert.equal(stale.body.code, 'visit_version_conflict');
    assert.deepEqual(await persisted(), beforeStale);

    const cancelledPlan = await call(managerToken, '/field-operations/visits', { customerId: customer.id, membershipId: commercial.membershipId, scheduledAt: future });
    assert.equal(cancelledPlan.status, 200);
    const cancelled = await call(managerToken, `/field-operations/visits/${cancelledPlan.body.id}/cancel`, { expectedVersion: 0, reason: 'Client requested another date' }, 'cancel-stable');
    assert.equal(cancelled.status, 200);
    assert.equal(cancelled.body.status, 'cancelled');
    assert.equal(cancelled.body.cancellation_reason, 'Client requested another date');
    assert.ok(cancelled.body.cancelled_at);
    const replayed = await call(managerToken, `/field-operations/visits/${cancelledPlan.body.id}/cancel`, { expectedVersion: 0, reason: 'Client requested another date' }, 'cancel-stable');
    assert.deepEqual(replayed, cancelled);

    const started = await call(workerToken, '/me/workdays/start', {});
    assert.equal(started.status, 200);
    assert.equal(started.body.role, 'commercial');
    assert.equal(started.body.total_visits, 1);
    assert.equal(started.body.completed_visits, 0);
    const beforeLocked = await persisted();
    for (const [path, input] of [
      [`/field-operations/visits/${id}/reschedule`, { scheduledAt: future, expectedVersion: 1 }],
      [`/field-operations/visits/${id}/cancel`, { expectedVersion: 1 }],
      ['/field-operations/visits', { customerId: customer.id, membershipId: commercial.membershipId, scheduledAt: new Date(Date.now() - 1000).toISOString() }],
    ] as const) {
      const response = await call(managerToken, path, input);
      assert.equal(response.status, 409);
      assert.equal(response.body.code, 'workday_already_started');
    }
    assert.deepEqual(await persisted(), beforeLocked);
    assert.equal((await call(workerToken, `/me/visits/${id}/check-in`, {})).body.execution_role, 'commercial');
    assert.equal((await call(workerToken, `/me/visits/${id}/close`, { result: 'attended', observations: 'Completed' })).status, 200);
    const closedDay = await call(workerToken, '/me/workdays/end', {});
    assert.equal(closedDay.status, 200);
    assert.equal(closedDay.body.total_visits, 1);
    assert.equal(closedDay.body.completed_visits, 1);

    // Simulate a later role assignment without rewriting prior business facts.
    await db.prisma.membership.update({ where: { id: commercial.membershipId }, data: { role: 'merchandiser' } });
    const history = await call(managerToken, `/field-operations/agenda?role=commercial`);
    assert.equal(history.status, 200);
    assert.equal(history.body.items.find((visit: any) => visit.id === id).member_role, 'commercial');
    const dayHistory = await call(managerToken, '/field-operations/workdays?role=commercial');
    assert.equal(dayHistory.body.items.find((day: any) => day.id === started.body.id).member_role, 'commercial');
    const unknown = await db.prisma.visit.create({ data: { companyId: manager.companyId, membershipId: commercial.membershipId,
      customerId: customer.id, scheduledAt: new Date(Date.now() + 3 * 86400000) } });
    const legacy = await call(managerToken, '/field-operations/agenda');
    assert.equal(legacy.body.items.find((visit: any) => visit.id === unknown.id).member_role, null);

    const raced = await call(managerToken, '/field-operations/visits', { customerId: customer.id, membershipId: raceMember.membershipId, scheduledAt: now });
    assert.equal(raced.status, 200);
    const race = await Promise.all([
      call(raceToken, '/me/workdays/start', {}),
      call(managerToken, `/field-operations/visits/${raced.body.id}/cancel`, { expectedVersion: 0 }),
    ]);
    assert.equal(race[0].status, 200);
    assert.ok([200, 409].includes(race[1].status));
    if (race[1].status === 409) assert.equal(race[1].body.code, 'workday_already_started');
    const raceDay = await call(raceToken, '/me/workday');
    const raceVisit = await db.prisma.visit.findUniqueOrThrow({ where: { id: raced.body.id } });
    assert.equal(raceDay.body.total_visits, raceVisit.status === 'cancelled' ? 0 : 1);
    const foreignToken = await login('foreign@test.example', 'foreign.example');
    const denied = await call(foreignToken, `/field-operations/visits/${id}/cancel`, { expectedVersion: 3 }, randomUUID(), 'foreign.example');
    assert.ok([403, 404].includes(denied.status));
  } finally {
    if (app) await app.close();
    await db.close();
  }
});
