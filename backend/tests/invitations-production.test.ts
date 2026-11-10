import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createServer } from 'node:net';
import { createTestDatabase, migrate, provision } from './support';
import { createApp } from '../src/app';
import { decryptInvitationToken } from '../src/modules/mail/token-cipher';
import { loadMailConfig } from '../src/modules/mail/config';
import { MailService } from '../src/modules/mail/mail.service';

test('mail configuration rejects insecure remote SMTP and incomplete credentials', () => {
  assert.throws(() => loadMailConfig({ MAIL_ENABLED: 'true' }));
  const enabled = { MAIL_ENABLED: 'true', SMTP_HOST: 'mail.example.com', SMTP_FROM: 'app@example.com', WEB_PUBLIC_URL: 'https://app.example.com', MAIL_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString('base64') };
  assert.throws(() => loadMailConfig({ ...enabled, SMTP_REQUIRE_TLS: 'false' }));
  assert.throws(() => loadMailConfig({ ...enabled, SMTP_USER: 'incomplete' }));
  assert.equal(loadMailConfig(enabled).SMTP_REQUIRE_TLS, true);
});

test('HTTP invitations are tenant-bound, single-use, expiring, resendable and durably delivered without passwords', async () => {
  const db = await createTestDatabase();
  const original = { ...process.env };
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  let rejectMail = true;
  const messages: string[] = [];
  const smtp = createServer((socket) => {
    socket.write('220 localhost SMTP test\r\n');
    let buffer = '';
    let data = false;
    let message = '';
    socket.on('data', (chunk) => {
      buffer += chunk.toString();
      let lineEnd: number;
      while ((lineEnd = buffer.indexOf('\r\n')) >= 0) {
        const line = buffer.slice(0, lineEnd);
        buffer = buffer.slice(lineEnd + 2);
        if (data) {
          if (line === '.') { data = false; messages.push(message); message = ''; socket.write('250 accepted\r\n'); }
          else message += line + '\n';
        } else if (/^EHLO|^HELO/.test(line)) socket.write('250 localhost\r\n');
        else if (/^DATA/.test(line)) { data = true; socket.write('354 continue\r\n'); }
        else if (/^RCPT/.test(line) && rejectMail) socket.write('451 temporary failure\r\n');
        else if (/^QUIT/.test(line)) socket.end('221 bye\r\n');
        else socket.write('250 OK\r\n');
      }
    });
  });
  await new Promise<void>((resolve) => smtp.listen(0, '127.0.0.1', resolve));
  const smtpPort = (smtp.address() as { port: number }).port;
  const key = Buffer.alloc(32, 7).toString('base64');
  Object.assign(process.env, { MAIL_ENABLED: 'true', SMTP_HOST: '127.0.0.1', SMTP_PORT: String(smtpPort), SMTP_SECURE: 'false', SMTP_REQUIRE_TLS: 'false', SMTP_FROM: 'app@example.com', WEB_PUBLIC_URL: 'http://localhost:3001', MAIL_ENCRYPTION_KEY: key, MAIL_WORKER_INTERVAL_MS: '60000' });
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  try {
    await migrate(db);
    const owner = await provision(db, 'invitation-test', 'Invitation owner', 'invitation-owner@example.com', 'owner-test-password');
    await db.prisma.user.update({ where: { id: owner.userId }, data: { isPlatformOwner: true } });
    app = await createApp(db.prisma, false, [], [{ host: 'owner.example', company: 'invitation-test' }]);
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const loginResponse = await fetch(base + '/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tenant-Host': 'owner.example' }, body: JSON.stringify({ email: 'invitation-owner@example.com', password: 'owner-test-password' }) });
    assert.equal(loginResponse.status, 200);
    const ownerToken = (await loginResponse.json() as { token: string }).token;
    const post = (path: string, body: unknown, token = ownerToken, operationKey = randomUUID()) => fetch(base + '/v1' + path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, 'X-Tenant-Host': 'owner.example', 'Idempotency-Key': operationKey }, body: JSON.stringify(body) });
    const publicPost = (token: string, password = 'new-invitation-password') => fetch(base + `/v1/invitations/${token}/accept`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) });
    const companyResponse = await post('/platform/companies', { name: 'Invited company', timeZone: 'America/Lima', hostname: 'invited.example', manager: { displayName: 'First manager', email: 'first-manager@example.com', phone: '+51999111222' } });
    assert.equal(companyResponse.status, 200);
    const company = await companyResponse.json() as { id: string; totalUserCount: number };
    assert.equal(company.totalUserCount, 1);
    const manager = await db.prisma.membership.findFirstOrThrow({ where: { companyId: company.id }, include: { user: true } });
    assert.equal(manager.role, 'manager');
    assert.equal(manager.user.passwordHash, null);
    const firstInvite = await db.prisma.invitation.findFirstOrThrow({ where: { membershipId: manager.id } });
    const firstToken = decryptInvitationToken(firstInvite.tokenCiphertext!, key);
    assert.notEqual(firstInvite.tokenCiphertext, firstToken);
    assert.notEqual(firstInvite.tokenHash, firstToken);
    const metadata = await fetch(base + `/v1/invitations/${firstToken}`);
    assert.equal(metadata.status, 200);
    assert.equal((await metadata.json() as { tenantHost: string }).tenantHost, 'invited.example');
    const accepted = await Promise.all([publicPost(firstToken), publicPost(firstToken)]);
    assert.deepEqual(accepted.map((response) => response.status).sort(), [200, 400]);
    assert.equal((await publicPost(firstToken)).status, 400);
    assert.equal((await db.prisma.invitation.findUniqueOrThrow({ where: { id: firstInvite.id } })).tokenCiphertext, null);
    assert.notEqual((await db.prisma.user.findUniqueOrThrow({ where: { id: manager.userId } })).passwordHash, 'new-invitation-password');

    const workerResponse = await post(`/platform/companies/${company.id}/members`, { displayName: 'Invited worker', email: 'worker-invite@example.com', phone: '+51999111223', role: 'commercial' });
    assert.equal(workerResponse.status, 200);
    const worker = await workerResponse.json() as { id: string; invitationStatus: string };
    assert.equal(worker.invitationStatus, 'pending');
    const old = await db.prisma.invitation.findFirstOrThrow({ where: { membershipId: worker.id } });
    const oldToken = decryptInvitationToken(old.tokenCiphertext!, key);
    await db.prisma.invitation.update({ where: { id: old.id }, data: { expiresAt: new Date(Date.now() - 1000) } });
    assert.equal((await publicPost(oldToken)).status, 410);
    const resend = await post(`/platform/companies/${company.id}/members/${worker.id}/invitation`, {});
    assert.equal(resend.status, 200);
    assert.equal((await publicPost(oldToken)).status, 400);
    const renewed = await db.prisma.invitation.findFirstOrThrow({ where: { membershipId: worker.id, revokedAt: null } });
    const token = decryptInvitationToken(renewed.tokenCiphertext!, key);
    await db.prisma.company.update({ where: { id: company.id }, data: { status: 'suspended' } });
    assert.equal((await publicPost(token)).status, 409);
    assert.equal((await db.prisma.invitation.findUniqueOrThrow({ where: { id: renewed.id } })).consumedAt, null);
    await db.prisma.company.update({ where: { id: company.id }, data: { status: 'active' } });

    const waitFor = async (predicate: () => Promise<boolean>) => {
      for (let attempt = 0; attempt < 100; attempt++) {
        if (await predicate()) return;
        await new Promise((resolve) => setTimeout(resolve, 20));
      }
      assert.fail('Expected asynchronous outbox transition');
    };
    await waitFor(async () => (await db.prisma.mailOutbox.findUniqueOrThrow({ where: { invitationId: renewed.id } })).attempts > 0);
    await waitFor(async () => (await db.prisma.mailOutbox.findUniqueOrThrow({ where: { invitationId: renewed.id } })).status !== 'sending');
    const failedAttempt = await db.prisma.mailOutbox.findUniqueOrThrow({ where: { invitationId: renewed.id } });
    assert.equal(failedAttempt.status, 'pending');
    assert.equal(failedAttempt.lastError, 'delivery_failed');
    rejectMail = false;
    await db.prisma.mailOutbox.update({ where: { invitationId: renewed.id }, data: { nextAttemptAt: new Date() } });
    app.get(MailService).kick();
    await waitFor(async () => (await db.prisma.mailOutbox.findUniqueOrThrow({ where: { invitationId: renewed.id } })).status === 'sent');
    assert.equal(messages.length, 1);
    assert.ok(!messages[0].includes('new-invitation-password'));
    assert.ok(messages[0].includes('/invitacion/'));
    assert.equal((await publicPost(token)).status, 200);
    const activated = await fetch(base + '/v1/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Tenant-Host': 'invited.example' }, body: JSON.stringify({ email: 'worker-invite@example.com', password: 'new-invitation-password' }) });
    assert.equal(activated.status, 200);
  } finally {
    if (app) await app.close();
    await new Promise<void>((resolve) => smtp.close(() => resolve()));
    for (const name of Object.keys(process.env)) if (!(name in original)) delete process.env[name];
    Object.assign(process.env, original);
    await db.close();
  }
});
