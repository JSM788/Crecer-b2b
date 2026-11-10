import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createTestDatabase, migrate, provision } from './support';
import { createApp } from '../src/app';
import { OperatorService } from '../src/modules/identity/services/operator.service';
import { CredentialsService } from '../src/modules/identity/services/credentials.service';

test('web allows only platform owners and managers, including existing sessions; native field access remains available', async () => {
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const owner = await provision(db, 'web-access', 'Web access', 'owner@example.test', 'long-test-password', 'America/Lima');
    await db.prisma.user.update({ where: { id: owner.userId }, data: { isPlatformOwner: true } });
    const operator = new OperatorService(db.prisma, new CredentialsService());
    await operator.addMember(owner.companyId, 'manager@example.test', 'long-test-password', 'manager');
    await operator.addMember(owner.companyId, 'commercial@example.test', 'long-test-password', 'commercial');
    await operator.addMember(owner.companyId, 'merchandiser@example.test', 'long-test-password', 'merchandiser');
    app = await createApp(db.prisma, false, [], [{host:'web.example',company:'web-access'}]);
    await app.listen(0, '127.0.0.1');
    const base = await app.getUrl();
    const login = (email: string, web = true) => fetch(base + (web ? '/v1/auth/web/login' : '/v1/auth/login'), {
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'long-test-password'}),
    });
    for (const email of ['owner@example.test','manager@example.test']) {
      const response = await login(email);
      assert.equal(response.status, 200);
      const {token} = await response.json() as {token:string};
      assert.equal((await fetch(base+'/v1/me',{headers:{Authorization:`Bearer ${token}`,'X-Client-Channel':'web'}})).status,200);
    }
    for (const email of ['commercial@example.test','merchandiser@example.test']) {
      const before = await db.prisma.session.count();
      const denied = await login(email);
      assert.equal(denied.status,403);
      assert.equal((await denied.json() as {code:string}).code,'web_access_denied');
      assert.equal(await db.prisma.session.count(),before);
      const mobile = await login(email,false);
      assert.equal(mobile.status,200);
      const {token} = await mobile.json() as {token:string};
      assert.equal((await fetch(base+'/v1/me',{headers:{Authorization:`Bearer ${token}`}})).status,200);
      const oldBrowserSession = await fetch(base+'/v1/me',{headers:{Authorization:`Bearer ${token}`,'X-Client-Channel':'web'}});
      assert.equal(oldBrowserSession.status,403);
      assert.equal((await oldBrowserSession.json() as {code:string}).code,'web_access_denied');
    }
  } finally { if(app) await app.close(); await db.close(); }
});
