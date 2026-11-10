import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, migrate } from './support';
import { createApp } from '../src/app';
import { OperatorService } from '../src/modules/identity/services/operator.service';
import { CredentialsService } from '../src/modules/identity/services/credentials.service';
import { MailService } from '../src/modules/mail/mail.service';
import { decryptInvitationToken } from '../src/modules/mail/token-cipher';

test('credential-only access, one-time activation, recovery and tenant-scoped audit hold through HTTP', async (context) => {
  const db = await createTestDatabase();
  const environment = { ...process.env };
  const key = Buffer.alloc(32, 9).toString('base64');
  Object.assign(process.env, { MAIL_ENABLED: 'true', SMTP_HOST: '127.0.0.1', SMTP_PORT: '1025', SMTP_SECURE: 'false',
    SMTP_REQUIRE_TLS: 'false', SMTP_FROM: 'test@example.test', WEB_PUBLIC_URL: 'http://localhost:3001', MAIL_ENCRYPTION_KEY: key });
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const operator = new OperatorService(db.prisma, new CredentialsService());
    const owner = await operator.provision('access-owner', 'Owner', 'owner@example.test', 'long-test-password', 'America/Lima', 'manager');
    await db.prisma.user.update({ where: { id: owner.userId }, data: { isPlatformOwner: true } });
    const manager = await operator.addMember(owner.companyId, 'manager@example.test', 'long-test-password', 'manager');
    const foreign = await operator.provision('access-foreign', 'Foreign', 'foreign@example.test', 'long-test-password', 'America/Lima', 'manager');
    app = await createApp(db.prisma, false, [], [{host:'owner.example', company:'access-owner'}, {host:'foreign.example', company:'access-foreign'}]);
    await app.listen(0, '127.0.0.1');
    // This block tests access rules, not SMTP; separate delivery tests exercise the outbox.
    context.mock.method(app.get(MailService), 'kick', () => {});
    const base = await app.getUrl();
    const call = async (path: string, body?: unknown, token?: string, host?: string) => {
      const response = await fetch(base + '/v1' + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID(),
          ...(token ? {Authorization:`Bearer ${token}`} : {}), ...(host ? {'X-Tenant-Host':host} : {}) },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      return { status: response.status, body: await response.json() as any };
    };
    const login = (email: string, password = 'long-test-password', host?: string) => call('/auth/login', {email,password}, undefined, host);
    const ownerLogin = await login('owner@example.test');
    assert.equal(ownerLogin.status, 200);
    const ownerToken = ownerLogin.body.token as string;
    assert.equal((await call('/me', undefined, ownerToken)).body.scope, 'platform');
    const managerLogin = await login('manager@example.test');
    assert.equal(managerLogin.status, 200);
    const managerToken = managerLogin.body.token as string;
    const me = await call('/me', undefined, managerToken);
    assert.equal(me.body.companyId, owner.companyId);
    assert.equal(me.body.role, 'manager');
    assert.equal((await login('manager@example.test', 'long-test-password', 'foreign.example')).status, 401);
    assert.equal((await login('manager@example.test', 'long-test-password', 'unknown.example')).status, 400);
    assert.equal((await call('/me', undefined, managerToken, 'foreign.example')).status, 401);

    const created = await call(`/platform/companies/${owner.companyId}/members`, {displayName:'New worker',email:'worker@example.test',phone:'+51999111222',role:'commercial'}, ownerToken);
    assert.equal(created.status, 200);
    assert.equal(created.body.activatedAt, null);
    const memberId = created.body.id as string;
    const userId = created.body.userId as string;
    assert.equal((await login('worker@example.test')).status, 401);
    assert.equal((await login('worker@example.test', '')).status, 400);
    const first = await db.prisma.invitation.findFirstOrThrow({ where: {membershipId:memberId,revokedAt:null} });
    const firstToken = decryptInvitationToken(first.tokenCiphertext!, key);
    assert.equal((await call(`/invitations/${firstToken}`)).body.purpose, 'activation');
    const activation = await call(`/invitations/${firstToken}/accept`, {password:'first-worker-password'});
    assert.equal(activation.status, 200);
    assert.equal(activation.body.purpose, 'activation');
    assert.equal((await call(`/invitations/${firstToken}/accept`, {password:'first-worker-password'})).status, 400);
    const activatedUser = await db.prisma.user.findUniqueOrThrow({ where:{id:userId} });
    assert.ok(activatedUser.activatedAt);
    assert.ok(activatedUser.passwordChangedAt);
    const workerLogin = await login('worker@example.test', 'first-worker-password');
    assert.equal(workerLogin.status, 200);
    const workerToken = workerLogin.body.token as string;
    const workerMe = await call('/me', undefined, workerToken);
    assert.equal(workerMe.body.membershipId, memberId);
    assert.equal(workerMe.body.role, 'commercial');
    assert.equal((await call('/team/members', undefined, workerToken)).status, 403);

    const resetRequest = await call(`/team/members/${memberId}/invitation`, {}, managerToken);
    assert.equal(resetRequest.status, 200);
    assert.equal(resetRequest.body.invitationStatus, 'accepted');
    const reset = await db.prisma.invitation.findFirstOrThrow({ where:{membershipId:memberId,revokedAt:null,consumedAt:null} });
    assert.equal(reset.purpose, 'password_reset');
    const resetToken = decryptInvitationToken(reset.tokenCiphertext!, key);
    assert.equal((await call(`/invitations/${resetToken}`)).body.purpose, 'password_reset');
    // Requesting recovery alone must not change credentials or revoke a valid session.
    assert.equal((await call('/me', undefined, workerToken)).status, 200);
    await db.prisma.invitation.update({where:{id:reset.id},data:{expiresAt:new Date(Date.now()-1000)}});
    assert.equal((await call(`/invitations/${resetToken}`)).status, 410);
    assert.ok(await db.prisma.accessEvent.findFirst({where:{invitationId:reset.id,event:'invitation_rejected',outcome:'invitation_expired'}}));
    assert.equal((await call(`/team/members/${memberId}/invitation`, {}, managerToken)).status, 200);
    assert.equal((await call(`/invitations/${resetToken}`)).status, 400);
    const renewed = await db.prisma.invitation.findFirstOrThrow({where:{membershipId:memberId,revokedAt:null,consumedAt:null}});
    const renewedToken = decryptInvitationToken(renewed.tokenCiphertext!, key);
    const completed = await Promise.all([
      call(`/invitations/${renewedToken}/accept`, {password:'second-worker-password'}),
      call(`/invitations/${renewedToken}/accept`, {password:'second-worker-password'}),
    ]);
    assert.deepEqual(completed.map(response=>response.status).sort(), [200,400]);
    assert.equal((await call('/me', undefined, workerToken)).status, 401);
    assert.equal((await login('worker@example.test', 'first-worker-password')).status, 401);
    assert.equal((await login('worker@example.test', 'second-worker-password')).status, 200);
    const recovered = await db.prisma.user.findUniqueOrThrow({where:{id:userId}});
    assert.equal(recovered.activatedAt!.toISOString(), activatedUser.activatedAt!.toISOString());
    assert.ok(recovered.passwordChangedAt! >= activatedUser.passwordChangedAt!);
    assert.equal(await db.prisma.accessEvent.count({where:{userId,event:'account_activated'}}), 1);
    assert.equal(await db.prisma.accessEvent.count({where:{userId,event:'password_reset_completed'}}), 1);

    const history = await call(`/team/members/${memberId}/access-history?pageSize=100`, undefined, managerToken);
    assert.equal(history.status, 200);
    assert.ok(history.body.items.some((entry:any)=>entry.event==='account_activated'));
    assert.ok(history.body.items.some((entry:any)=>entry.event==='password_reset_completed'));
    assert.ok(history.body.items.every((entry:any)=>Number.isFinite(Date.parse(entry.occurredAt))));
    const historyText = JSON.stringify(history.body);
    for (const secret of [firstToken,resetToken,renewedToken,'first-worker-password','second-worker-password',recovered.passwordHash!]) assert.equal(historyText.includes(secret),false);
    const foreignLogin = await login('foreign@example.test');
    assert.equal((await call(`/team/members/${memberId}/access-history`, undefined, foreignLogin.body.token)).status,404);
    assert.equal((await call(`/team/members/${memberId}/invitation`, {}, foreignLogin.body.token)).status,409);
    assert.equal((await call(`/team/members/${owner.membershipId}/invitation`, {}, managerToken)).status,409);
    const team = await call('/team/members', undefined, managerToken);
    assert.equal(team.body.items.some((entry:any)=>entry.userId===owner.userId),false);

    // Ambiguous membership selection must fail closed rather than pick the first company.
    await db.prisma.membership.create({data:{companyId:foreign.companyId,userId,role:'commercial'}});
    const ambiguous = await login('worker@example.test','second-worker-password');
    assert.equal(ambiguous.status,409);
    assert.equal(ambiguous.body.code,'company_selection_required');
    assert.equal((await login('worker@example.test','second-worker-password','owner.example')).status,200);
    await db.prisma.company.update({where:{id:owner.companyId},data:{status:'suspended'}});
    assert.equal((await login('manager@example.test')).status,401);
    assert.equal((await call('/me',undefined,managerToken)).status,401);
  } finally {
    if (app) await app.close();
    context.mock.restoreAll();
    for (const name of Object.keys(process.env)) if (!(name in environment)) delete process.env[name];
    Object.assign(process.env,environment);
    await db.close();
  }
});

test('email changes revoke previously emailed activation links without changing identity or password', async (context) => {
  const db = await createTestDatabase();
  const environment = {...process.env};
  const key = Buffer.alloc(32, 8).toString('base64');
  Object.assign(process.env,{MAIL_ENABLED:'true',SMTP_HOST:'127.0.0.1',SMTP_PORT:'1025',SMTP_SECURE:'false',SMTP_REQUIRE_TLS:'false',SMTP_FROM:'test@example.test',WEB_PUBLIC_URL:'http://localhost:3001',MAIL_ENCRYPTION_KEY:key});
  delete process.env.SMTP_USER;
  delete process.env.SMTP_PASSWORD;
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const operator = new OperatorService(db.prisma,new CredentialsService());
    const owner = await operator.provision('email-correction','Email correction','email-owner@example.test','long-test-password','America/Lima','manager');
    await db.prisma.user.update({where:{id:owner.userId},data:{isPlatformOwner:true}});
    app = await createApp(db.prisma,false,[],[{host:'correction.example',company:'email-correction'}]);
    await app.listen(0,'127.0.0.1');
    context.mock.method(app.get(MailService),'kick',()=>{});
    const base=await app.getUrl();
    const post=async(path:string,body:unknown,token?:string)=>{
      const response=await fetch(base+'/v1'+path,{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':randomUUID(),...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
      return {status:response.status,body:await response.json() as any};
    };
    const ownerToken=(await post('/auth/login',{email:'email-owner@example.test',password:'long-test-password'})).body.token as string;
    const member=(await post(`/platform/companies/${owner.companyId}/members`,{displayName:'Worker',email:'mistyped@example.test',phone:'+51999111222',role:'commercial'},ownerToken)).body;
    const invitation=await db.prisma.invitation.findFirstOrThrow({where:{membershipId:member.id,revokedAt:null}});
    const token=decryptInvitationToken(invitation.tokenCiphertext!,key);
    const before=await db.prisma.user.findUniqueOrThrow({where:{id:member.userId}});
    const edited=await post(`/platform/companies/${owner.companyId}/members/${member.id}/details`,{displayName:'Worker',email:'corrected@example.test',phone:'+51999111222',role:'commercial'},ownerToken);
    assert.equal(edited.status,200);
    const inspected=await fetch(base+`/v1/invitations/${token}`);
    assert.equal(inspected.status,400);
    assert.equal((await post(`/invitations/${token}/accept`,{password:'attacker-new-password'})).status,400);
    const after=await db.prisma.user.findUniqueOrThrow({where:{id:member.userId}});
    assert.equal(after.id,before.id);
    assert.equal(after.email,'corrected@example.test');
    assert.equal(after.passwordHash,before.passwordHash);
    assert.equal(after.activatedAt,null);
    assert.ok((await db.prisma.invitation.findUniqueOrThrow({where:{id:invitation.id}})).revokedAt);
    assert.equal((await db.prisma.mailOutbox.findUniqueOrThrow({where:{invitationId:invitation.id}})).status,'cancelled');
    assert.ok(await db.prisma.accessEvent.findFirst({where:{invitationId:invitation.id,event:'invitation_revoked',outcome:'email_changed'}}));
  } finally {
    if(app)await app.close();
    context.mock.restoreAll();
    for(const name of Object.keys(process.env))if(!(name in environment))delete process.env[name];
    Object.assign(process.env,environment);
    await db.close();
  }
});
