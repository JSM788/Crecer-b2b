import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, migrate, provision } from './support';
import { createApp } from '../src/app';
import { OperatorService } from '../src/modules/identity/services/operator.service';
import { CredentialsService } from '../src/modules/identity/services/credentials.service';

test('access history presents one sent email while retaining technical audit rows and tenant boundaries', async () => {
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const owner = await provision(db, 'history-display', 'History display', 'history-owner@example.test', 'long-test-password', 'America/Lima');
    await db.prisma.user.update({ where: { id: owner.userId }, data: { isPlatformOwner: true } });
    const operator = new OperatorService(db.prisma, new CredentialsService());
    await operator.addMember(owner.companyId, 'history-manager@example.test', 'long-test-password', 'manager');
    const worker = await operator.addMember(owner.companyId, 'history-worker@example.test', 'long-test-password', 'commercial');
    await operator.provision('history-foreign', 'Foreign', 'history-foreign@example.test', 'long-test-password', 'America/Lima', 'manager');
    const expiresAt = new Date('2026-11-05T12:00:00.000Z');
    const invitation = await db.prisma.invitation.create({ data: {
      companyId: owner.companyId, membershipId: worker.membershipId, createdByUserId: owner.userId,
      purpose: 'password_reset', tokenHash: 'f'.repeat(64), tokenCiphertext: null, expiresAt,
    } });
    const events = ['invitation_reissued', 'mail_attempted', 'mail_accepted'];
    await db.prisma.accessEvent.createMany({ data: events.map((event, index) => ({
      userId: worker.userId, companyId: owner.companyId, membershipId: worker.membershipId,
      invitationId: invitation.id,
      event, outcome: index === 2 ? 'smtp_accepted' : 'queued',
      occurredAt: new Date(Date.UTC(2026, 10, 3, 12, 0, index)), details: { purpose: 'password_reset' },
    })) });
    app = await createApp(db.prisma, false, [], [{ host: 'history.example', company: 'history-display' }]);
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const login = async (email: string) => {
      const response = await fetch(base + '/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'long-test-password' }) });
      assert.equal(response.status, 200);
      return (await response.json() as { token: string }).token;
    };
    const managerToken = await login('history-manager@example.test');
    const get = (path: string, token: string) => fetch(base + '/v1' + path, { headers: { Authorization: `Bearer ${token}` } });
    const path = `/team/members/${worker.membershipId}/access-history`;
    const response = await get(path + '?page=1&pageSize=1', managerToken);
    assert.equal(response.status, 200);
    const page = await response.json() as { items: { event: string; details: { purpose: string; expiresAt: string } }[]; total: number };
    assert.equal(page.total, 1);
    assert.equal(page.items.length, 1);
    assert.equal(page.items[0].event, 'mail_accepted');
    assert.equal(page.items[0].details.purpose, 'password_reset');
    assert.equal(page.items[0].details.expiresAt, expiresAt.toISOString());
    const second = await get(path + '?page=2&pageSize=1', managerToken);
    assert.equal(second.status, 200);
    assert.deepEqual((await second.json() as { items: unknown[] }).items, []);
    assert.equal(await db.prisma.accessEvent.count({ where: { membershipId: worker.membershipId } }), 3);
    const ownerToken = await login('history-owner@example.test');
    const global = await get(`/platform/companies/${owner.companyId}/members/${worker.membershipId}/access-history`, ownerToken);
    assert.equal(global.status, 200);
    assert.equal((await global.json() as { total: number }).total, 1);
    const foreignToken = await login('history-foreign@example.test');
    assert.equal((await get(path, foreignToken)).status, 404);
  } finally {
    if (app) await app.close();
    await db.close();
  }
});
