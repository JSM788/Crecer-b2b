import { test } from 'node:test';
import assert from 'node:assert/strict';

import { createTestDatabase, assignVisit } from './support';
import { migrate } from './support';
import { provision } from './support';
import { createApp } from '../src/app';

import { readFile } from 'node:fs/promises';

test('HTTP contract validates requests, protects resources and follows field transitions', async () => {
  const db = await createTestDatabase();
  await migrate(db);
  const member = await provision(
    db,
    'http-company',
    'HTTP Company',
    'http@example.com',
    'password-with-length',
  );
  const { visit } = await assignVisit(db, member);
  const other = await provision(
    db,
    'other-company',
    'Other Company',
    'http@example.com',
    'password-with-length',
  );
  const app = await createApp(
    db.prisma,
    false,
    [],
    [
      { host: 'company.example', company: 'http-company' },
      { host: 'other.example', company: 'other-company' },
    ],
  );
  try {
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    let token = '';
    let host: string | undefined = 'company.example';
    const call = async (path: string, body?: unknown, key?: string) => {
      const response = await fetch(url + '/v1' + path, {
        method: body === undefined ? 'GET' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(host ? { 'X-Tenant-Host': host } : {}),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(key ? { 'Idempotency-Key': key } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
      assert.ok(response.headers.get('x-request-id'));
      const result = (await response.json()) as any;
      return { status: response.status, body: result };
    };
    assert.equal((await call('/me')).status, 401);
    assert.equal(
      (
        await call('/auth/login', {
          company: 'http-company',
          email: 'http@example.com',
          password: 'password-with-length',
          companyId: crypto.randomUUID(),
        })
      ).status,
      400,
    );
    const credentials = {
      email: 'http@example.com',
      password: 'password-with-length',
    };
    assert.equal(
      (await call('/auth/login', { ...credentials, company: 'http-company' }))
        .status,
      400,
    );
    for (const invalid of [
      undefined,
      'unknown.example',
      'company.example:3001',
      'company.example,other.example',
    ]) {
      host = invalid;
      assert.equal((await call('/auth/login', credentials)).status, 400);
    }
    host = 'other.example';
    const otherLogin = await call('/auth/login', credentials);
    assert.equal(otherLogin.status, 200);
    token = otherLogin.body.token;
    assert.equal((await call('/me')).body.companyId, other.companyId);
    host = 'company.example';
    const login = await call('/auth/login', credentials);
    token = login.body.token;
    assert.equal(login.status, 200);
    host = 'other.example';
    const before = await db.query('SELECT * FROM operations');
    assert.equal((await call('/me')).status, 401);
    assert.equal(
      (await call('/me/workdays/start', {}, 'wrong-domain')).status,
      401,
    );
    assert.equal((await call('/auth/logout', {})).status, 401);
    assert.deepEqual(await db.query('SELECT * FROM operations'), before);
    host = 'company.example';
    assert.equal((await call('/me')).body.companyId, member.companyId);
    assert.equal((await call('/me/workday')).body, null);
    assert.equal((await call('/me/agenda')).body.length, 1);
    assert.equal((await call('/me/workdays/start', {})).status, 400);
    assert.equal(
      (
        await call(
          '/me/workdays/start',
          { companyId: member.companyId },
          'invalid',
        )
      ).status,
      400,
    );
    assert.equal((await call('/me/workdays/start', {}, 'start')).status, 200);
    assert.equal(
      (await call(`/me/visits/${visit.id}/check-in`, {}, 'checkin')).status,
      200,
    );
    assert.equal(
      (
        await call(
          `/me/visits/${visit.id}/close`,
          { result: 'ordered', observations: '' },
          'bad',
        )
      ).status,
      400,
    );
    assert.equal(
      (
        await call(
          `/me/visits/${visit.id}/close`,
          { result: 'attended', observations: '' },
          'close',
        )
      ).status,
      200,
    );
    assert.equal((await call('/me/workdays/end', {}, 'end')).status, 200);
    const contract = await call('/openapi.json');
    assert.ok(contract.body.paths['/v1/me/visits/{id}/close']);
    assert.deepEqual(
      JSON.parse(await readFile('contracts/openapi.json', 'utf8')),
      contract.body,
    );
    assert.equal((await call('/auth/logout', {})).status, 200);
    assert.equal((await call('/me')).status, 401);
  } finally {
    await app.close();
    await db.close();
  }
});
