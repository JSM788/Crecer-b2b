import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, migrate } from './support';
import { createApp } from '../src/app';
import { OperatorService } from '../src/modules/identity/services/operator.service';
import { CredentialsService } from '../src/modules/identity/services/credentials.service';

test('weekly routes sync blocks repeating a customer within the same week', async () => {
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const operator = new OperatorService(db.prisma, new CredentialsService());
    const manager = await operator.provision(
      'aquamundo',
      'Aquamundo',
      'manager@routes.example',
      'long-test-password',
      'America/Lima',
      'manager',
    );
    const commercial = await operator.addMember(
      manager.companyId,
      'seller@routes.example',
      'long-test-password',
      'commercial',
    );
    const customerA = await db.prisma.customer.create({
      data: {
        companyId: manager.companyId,
        name: 'Cliente A',
        address: 'https://maps.app.goo.gl/example',
        district: 'Lima',
      },
    });
    const customerB = await db.prisma.customer.create({
      data: {
        companyId: manager.companyId,
        name: 'Cliente B',
        address: 'Av. Javier Prado 123',
        district: 'San Isidro',
      },
    });
    await db.prisma.customerAssignment.createMany({
      data: [customerA.id, customerB.id].map((customerId) => ({
        companyId: manager.companyId,
        customerId,
        membershipId: commercial.membershipId,
      })),
    });

    app = await createApp(db.prisma, false, [], [
      { host: 'aquamundo.example', company: 'aquamundo' },
    ]);
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();

    const call = async (token: string, path: string, body?: unknown) => {
      const response = await fetch(`${base}/v1${path}`, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Host': 'aquamundo.example',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'Idempotency-Key': randomUUID(),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, body: (await response.json()) as any };
    };

    const managerToken = (
      await call('', '/auth/login', {
        email: 'manager@routes.example',
        password: 'long-test-password',
      })
    ).body.token as string;

    // 1. Rejects repeating customerA across Monday and Tuesday in the same payload.
    const dupPayload = await call(managerToken, '/field-operations/routes/sync', {
      membershipId: commercial.membershipId,
      days: [
        { date: '2026-11-09', customerIds: [customerA.id] },
        { date: '2026-11-10', customerIds: [customerA.id] },
      ],
    });
    assert.equal(dupPayload.status, 409);
    assert.equal(dupPayload.body.code, 'customer_already_scheduled_this_week');

    // 2. Schedules customerA on Monday and customerB on Tuesday cleanly.
    const initial = await call(managerToken, '/field-operations/routes/sync', {
      membershipId: commercial.membershipId,
      days: [
        { date: '2026-11-09', customerIds: [customerA.id] },
        { date: '2026-11-10', customerIds: [customerB.id] },
      ],
    });
    assert.equal(initial.status, 200);
    assert.equal(initial.body.scheduled, 2);

    // 3. Allows moving pending customerA from Monday to Wednesday when Monday has no workday.
    const moved = await call(managerToken, '/field-operations/routes/sync', {
      membershipId: commercial.membershipId,
      days: [
        { date: '2026-11-09', customerIds: [] },
        { date: '2026-11-10', customerIds: [customerB.id] },
        { date: '2026-11-11', customerIds: [customerA.id] },
      ],
    });
    assert.equal(moved.status, 200);
    assert.equal(moved.body.scheduled, 2);

    // 4. Clear Wednesday, then mark Monday completed with customerA; Thursday must fail.
    const clearedWed = await call(managerToken, '/field-operations/routes/sync', {
      membershipId: commercial.membershipId,
      days: [{ date: '2026-11-11', customerIds: [] }],
    });
    assert.equal(clearedWed.status, 200);

    const mondayWorkday = await db.prisma.workday.create({
      data: {
        companyId: manager.companyId,
        membershipId: commercial.membershipId,
        businessDate: new Date('2026-11-09T00:00:00.000Z'),
        status: 'completed',
        startedAt: new Date('2026-11-09T14:00:00.000Z'),
        endedAt: new Date('2026-11-09T18:00:00.000Z'),
      },
    });
    await db.prisma.visit.create({
      data: {
        companyId: manager.companyId,
        membershipId: commercial.membershipId,
        customerId: customerA.id,
        workdayId: mondayWorkday.id,
        scheduledAt: new Date('2026-11-09T15:00:00.000Z'),
        status: 'completed',
        arrivedAt: new Date('2026-11-09T15:10:00.000Z'),
        endedAt: new Date('2026-11-09T15:30:00.000Z'),
        result: 'attended',
      },
    });

    const repeatVisited = await call(managerToken, '/field-operations/routes/sync', {
      membershipId: commercial.membershipId,
      days: [
        { date: '2026-11-12', customerIds: [customerA.id] },
      ],
    });
    assert.equal(repeatVisited.status, 409);
    assert.equal(repeatVisited.body.code, 'customer_already_scheduled_this_week');

    // 5. Allows scheduling customerA in the following week.
    const nextWeek = await call(managerToken, '/field-operations/routes/sync', {
      membershipId: commercial.membershipId,
      days: [
        { date: '2026-11-16', customerIds: [customerA.id] },
      ],
    });
    assert.equal(nextWeek.status, 200);
    assert.equal(nextWeek.body.scheduled, 1);
  } finally {
    if (app) await app.close();
    await db.close();
  }
});
