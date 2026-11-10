import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, migrate, provision } from './support';
import { createApp } from '../src/app';
import { OperatorService } from '../src/modules/identity/services/operator.service';
import { CredentialsService } from '../src/modules/identity/services/credentials.service';
import { memberInputSchema, companyInputSchema } from '../src/modules/platform/dto/platform.dto';

test('new accounts require an international phone for every role and initial manager', () => {
  for (const role of ['manager', 'commercial', 'merchandiser']) {
    const input = { displayName: 'User', email: 'user@example.com', role };
    assert.equal(memberInputSchema.safeParse(input).success, false);
    assert.equal(memberInputSchema.safeParse({ ...input, phone: '123' }).success, false);
    assert.equal(memberInputSchema.safeParse({ ...input, phone: '+51 999 111 222' }).success, true);
  }
  const company = { name: 'Company', timeZone: 'America/Lima', hostname: 'company.example', manager: { displayName: 'Manager', email: 'manager@example.com' } };
  assert.equal(companyInputSchema.safeParse(company).success, false);
  assert.equal(companyInputSchema.safeParse({ ...company, manager: { ...company.manager, phone: '+51999111222' } }).success, true);
});

test('manager edits only own-company profiles and preserves identity, role and access audit', async () => {
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const manager = await provision(db, 'profile', 'Profile', 'manager@example.com', 'profile-test-password');
    await db.prisma.membership.update({ where: { id: manager.membershipId }, data: { role: 'manager' } });
    const other = await provision(db, 'foreign', 'Foreign', 'foreign@example.com', 'profile-test-password');
    const operator = new OperatorService(db.prisma, new CredentialsService());
    const worker = await operator.addMember(manager.companyId, 'worker@example.com', 'profile-test-password', 'commercial');
    app = await createApp(db.prisma, false, [], [{ host: 'profile.example', company: 'profile' }]);
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    const login = async (email: string) => {
      const response = await fetch(url + '/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tenant-Host': 'profile.example' }, body: JSON.stringify({ email, password: 'profile-test-password' }) });
      assert.equal(response.status, 200);
      return (await response.json() as { token: string }).token;
    };
    const token = await login('manager@example.com');
    const workerToken = await login('worker@example.com');
    const input = { displayName: 'Worker renamed', email: 'updated@example.com', phone: '+51 999 111 222' };
    const post = (body: unknown, target = worker.membershipId, bearer = token, key = randomUUID()) => fetch(`${url}/v1/team/members/${target}/details`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tenant-Host': 'profile.example', Authorization: `Bearer ${bearer}`, 'Idempotency-Key': key }, body: JSON.stringify(body) });
    const before = await db.prisma.user.findUniqueOrThrow({ where: { id: worker.userId } });
    for (const [body, target, bearer] of [
      [{ ...input, role: 'manager' }, worker.membershipId, token],
      [{ ...input, active: false }, worker.membershipId, token],
      [{ ...input, password: 'new-test-password' }, worker.membershipId, token],
      [input, other.membershipId, token],
      [input, worker.membershipId, workerToken],
      [{ ...input, email: 'foreign@example.com' }, worker.membershipId, token],
    ] as const) {
      assert.notEqual((await post(body, target, bearer)).status, 200);
      assert.deepEqual(await db.prisma.user.findUniqueOrThrow({ where: { id: worker.userId } }), before);
    }
    const key = randomUUID();
    const result = await post(input, worker.membershipId, token, key);
    assert.equal(result.status, 200, await result.clone().text());
    const updated = await result.json() as { id: string; userId: string; role: string; phone: string };
    assert.equal(updated.id, worker.membershipId);
    assert.equal(updated.userId, worker.userId);
    assert.equal(updated.role, 'commercial');
    assert.equal(updated.phone, '+51999111222');
    assert.deepEqual(await (await post(input, worker.membershipId, token, key)).json(), updated);
    const user = await db.prisma.user.findUniqueOrThrow({ where: { id: worker.userId } });
    assert.equal(user.passwordHash, before.passwordHash);
    assert.equal(await db.prisma.session.count({ where: { membership: { userId: worker.userId } } }), 0);
    assert.equal(await db.prisma.accessEvent.count({ where: { membershipId: worker.membershipId, event: 'account_updated' } }), 1);
    const list = await fetch(url + '/v1/team/members', { headers: { Authorization: `Bearer ${token}`, 'X-Tenant-Host': 'profile.example' } });
    assert.equal(list.status, 200);
    assert.equal((await list.json() as { items: Array<{ id: string; phone: string }> }).items.find(item => item.id === worker.membershipId)?.phone, '+51999111222');
    const pending = await db.prisma.membership.create({ data: { company: { connect: { id: manager.companyId } }, role: 'merchandiser', user: { create: { email: 'pending@example.com', passwordHash: null } } } });
    const invite = await fetch(`${url}/v1/team/members/${pending.id}/invitation`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tenant-Host': 'profile.example', Authorization: `Bearer ${token}`, 'Idempotency-Key': randomUUID() }, body: '{}' });
    assert.equal(invite.status, 200);
    const originalLink = await db.prisma.invitation.findFirstOrThrow({ where: { membershipId: pending.id } });
    assert.equal((await post({ ...input, email: 'corrected@example.com' }, pending.id)).status, 200);
    assert.notEqual((await db.prisma.invitation.findUniqueOrThrow({ where: { id: originalLink.id } })).revokedAt, null);
    const replacement = await db.prisma.invitation.findFirstOrThrow({ where: { membershipId: pending.id, revokedAt: null } });
    assert.notEqual(replacement.id, originalLink.id);
    assert.equal((await db.prisma.user.findUniqueOrThrow({ where: { id: pending.userId } })).passwordHash, null);
    const protectedUser = await db.prisma.user.create({ data: { email: 'protected@example.com', isPlatformOwner: true } });
    const protectedMember = await db.prisma.membership.create({ data: { companyId: manager.companyId, userId: protectedUser.id, role: 'manager' } });
    assert.notEqual((await post(input, protectedMember.id)).status, 200);
    await operator.addMember(other.companyId, 'updated@example.com', 'profile-test-password', 'commercial');
    assert.notEqual((await post({ ...input, displayName: 'Cross-company change' })).status, 200);
    assert.equal((await db.prisma.user.findUniqueOrThrow({ where: { id: worker.userId } })).displayName, input.displayName);
  } finally { await app?.close(); await db.close(); }
});
