import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, migrate, provision } from './support';
import { createApp } from '../src/app';

test('platform queries paginate and filter in PostgreSQL beyond 200 users without mixing companies', async () => {
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const owner = await provision(db, 'paged-platform', 'Paged company', 'paged-owner@example.com', 'paged-test-password');
    await db.prisma.user.update({ where: { id: owner.userId }, data: { isPlatformOwner: true } });
    const other = await db.prisma.company.create({ data: { slug: 'paged-other', name: 'Other company', timeZone: 'America/Lima' } });
    const manager = await db.prisma.user.create({ data: { email: 'company-manager@example.com', passwordHash: null } });
    await db.prisma.membership.create({ data: { userId: manager.id, companyId: other.id, role: 'manager' } });
    const workers = Array.from({ length: 205 }, (_, index) => ({ id: randomUUID(), email: `paged-${String(index).padStart(3, '0')}@example.com`, passwordHash: null, displayName: `Worker ${index}` }));
    await db.prisma.user.createMany({ data: workers });
    await db.prisma.membership.createMany({ data: workers.map((user, index) => ({ userId: user.id, companyId: owner.companyId, role: index === 204 ? 'merchandiser' : 'commercial', createdAt: new Date(2026, 0, 1, 0, index), active: index !== 204 })) });
    const outsider = await db.prisma.user.create({ data: { email: 'paged-outsider@example.com', passwordHash: null } });
    await db.prisma.membership.create({ data: { userId: outsider.id, companyId: other.id, role: 'commercial' } });
    app = await createApp(db.prisma, false, [], [{ host: 'paged.example', company: 'paged-platform' }]);
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const response = await fetch(base + '/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tenant-Host': 'paged.example' }, body: JSON.stringify({ email: 'paged-owner@example.com', password: 'paged-test-password' }) });
    assert.equal(response.status, 200);
    const token = (await response.json() as { token: string }).token;
    const get = (query: string) => fetch(base + `/v1/platform/companies/${owner.companyId}/members` + query, { headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Host': 'paged.example' } });
    const pages: string[] = [];
    for (const page of [1, 2, 3]) {
      const result = await get(`?page=${page}&pageSize=100`);
      assert.equal(result.status, 200);
      const body = await result.json() as { items: { id: string; companyId: string }[]; total: number; page: number };
      assert.equal(body.total, 206);
      assert.equal(body.page, page);
      assert.ok(body.items.every((member) => member.companyId === owner.companyId));
      pages.push(...body.items.map((member) => member.id));
    }
    assert.equal(new Set(pages).size, 206);
    const filtered = await get('?search=Worker%20204&role=merchandiser&active=false');
    assert.equal(filtered.status, 200);
    const filteredBody = await filtered.json() as { total: number; items: { email: string }[] };
    assert.equal(filteredBody.total, 1);
    assert.equal(filteredBody.items[0].email, 'paged-204@example.com');
    assert.equal((await get('?pageSize=101')).status, 400);
    assert.equal((await get('?page=0')).status, 400);
    const companies = await fetch(base + '/v1/platform/companies?search=Other&pageSize=1', { headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Host': 'paged.example' } });
    assert.equal(companies.status, 200);
    const companyPage = await companies.json() as { total: number; items: { id: string; managerEmail: string | null }[] };
    assert.equal(companyPage.total, 1);
    assert.equal(companyPage.items[0].id, other.id);
    assert.equal(companyPage.items[0].managerEmail, 'company-manager@example.com');
    const byEmail = await fetch(base + '/v1/platform/companies?search=company-manager%40example.com', { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(byEmail.status, 200);
    const emailPage = await byEmail.json() as { total: number; items: { id: string }[] };
    assert.equal(emailPage.total, 1);
    assert.equal(emailPage.items[0].id, other.id);
  } finally {
    if (app) await app.close();
    await db.close();
  }
});
