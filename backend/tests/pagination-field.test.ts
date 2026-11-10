import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, migrate } from './support';
import { createApp } from '../src/app';
import { OperatorService } from '../src/modules/identity/services/operator.service';
import { CredentialsService } from '../src/modules/identity/services/credentials.service';

test('customer and agenda pages filter the complete tenant dataset beyond 200 rows', async () => {
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const operator = new OperatorService(db.prisma, new CredentialsService());
    const manager = await operator.provision('paging', 'Paging', 'manager@test.example', 'long-test-password', 'America/Lima', 'manager');
    const worker = await operator.addMember(manager.companyId, 'worker@test.example', 'long-test-password', 'commercial');
    const foreign = await operator.provision('foreign', 'Foreign', 'foreign@test.example', 'long-test-password');
    const data = Array.from({ length: 213 }, (_, index) => ({ companyId: manager.companyId,
      name: `Customer ${index.toString().padStart(3, '0')}`, address: 'Address', district: index === 212 ? 'Target' : 'Other',
      createdAt: new Date(1700000000000 + index * 1000) }));
    await db.prisma.customer.createMany({ data: [...data, { companyId: foreign.companyId, name: 'Customer foreign', address: 'Address', district: 'Target' }] });
    const customers = await db.prisma.customer.findMany({ where: { companyId: manager.companyId }, orderBy: { name: 'asc' } });
    await db.prisma.customerAssignment.createMany({ data: customers.map((customer) => ({ companyId: manager.companyId, customerId: customer.id, membershipId: worker.membershipId })) });
    await db.prisma.visit.createMany({ data: customers.map((customer, index) => ({ companyId: manager.companyId, customerId: customer.id,
      membershipId: worker.membershipId, plannedRole: 'commercial', scheduledAt: new Date(1700000000000 + index * 60000) })) });
    app = await createApp(db.prisma, false, [], [{ host: 'paging.example', company: 'paging' }]);
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    let token = '';
    const get = async (path: string) => {
      const response = await fetch(base + '/v1' + path, { headers: { 'X-Tenant-Host': 'paging.example', Authorization: `Bearer ${token}` } });
      return { status: response.status, body: await response.json() as any };
    };
    const login = async (email: string) => {
      const response = await fetch(base + '/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tenant-Host': 'paging.example' },
        body: JSON.stringify({ email, password: 'long-test-password' }) });
      token = (await response.json() as any).token;
    };
    await login('manager@test.example');
    const third = await get('/customers?page=3&pageSize=100');
    assert.equal(third.status, 200);
    assert.equal(third.body.total, 213);
    assert.equal(third.body.items.length, 13);
    assert.equal(third.body.page, 3);
    const newest = await get('/customers?pageSize=1');
    assert.equal(newest.body.items[0].name, 'Customer 212');
    const filtered = await get(`/customers?search=Customer%20212&district=Target&membershipId=${worker.membershipId}`);
    assert.equal(filtered.body.total, 1);
    assert.equal(filtered.body.items[0].name, 'Customer 212');
    assert.equal((await get('/customers?district=Target')).body.total, 1);
    assert.equal((await get('/customers?assignment=unassigned')).body.total, 0);
    assert.equal((await get('/customers?pageSize=101')).status, 400);
    assert.equal((await get('/customers?page=0')).status, 400);
    const agenda = await get('/field-operations/agenda?page=3&pageSize=100');
    assert.equal(agenda.body.total, 213);
    assert.equal(agenda.body.items.length, 13);
    assert.equal((await get('/field-operations/agenda?search=Customer%20212')).body.total, 1);
    await login('worker@test.example');
    const own = await get('/me/agenda?page=3&pageSize=100');
    assert.equal(own.body.total, 213);
    assert.equal(own.body.items.length, 13);
    const portfolio = await get('/me/customers?page=3&pageSize=100');
    assert.equal(portfolio.body.total, 213);
    assert.equal(portfolio.body.items.length, 13);
  } finally {
    if (app) await app.close();
    await db.close();
  }
});
