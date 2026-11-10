import { test } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createTestDatabase, migrate, provision, assignVisit } from './support';
import { createApp } from '../src/app';
import { OperatorService } from '../src/modules/identity/services/operator.service';
import { CredentialsService } from '../src/modules/identity/services/credentials.service';
import { ApiDocumentService } from '../src/modules/system/services/api-document.service';

test('company field planning requires its own capability and preserves personal scopes', async () => {
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const owner = await provision(
      db,
      'team',
      'Team',
      'manager@example.com',
      'team-test-password',
    );
    const foreign = await provision(
      db,
      'foreign',
      'Foreign',
      'manager@example.com',
      'team-test-password',
    );
    const foreignFixture = await assignVisit(db, foreign);
    const merchId = randomUUID();
    const merchUserId = randomUUID();
    await db.query(
      "INSERT INTO users(id,email,password_hash) SELECT $1,'merch@example.com',password_hash FROM users WHERE id=$2",
      [merchUserId, owner.userId],
    );
    await db.query(
      "INSERT INTO memberships(id,company_id,user_id,role) VALUES($1,$2,$3,'merchandiser')",
      [merchId, owner.companyId, merchUserId],
    );
    const { customer } = await assignVisit(db, owner, '2020-01-01T12:00:00Z');
    await db.query(
      'INSERT INTO customer_assignments(company_id,customer_id,membership_id) VALUES($1,$2,$3)',
      [owner.companyId, customer.id, merchId],
    );
    app = await createApp(
      db.prisma,
      false,
      [],
      [{ host: 'team.example', company: 'team' }],
    );
    await app.listen(0, '127.0.0.1');
    const document = app.get(ApiDocumentService).document() as {
      paths: Record<
        string,
        { get?: { parameters: { name: string; in: string }[] }; post?: unknown }
      >;
    };
    assert.ok(document.paths['/v1/me/visits/{id}/close'].post);
    assert.ok(document.paths['/v1/health'].get);
    assert.deepEqual(
      document.paths['/v1/field-operations/agenda']
        .get!.parameters.filter((parameter) => parameter.in === 'query')
        .map((parameter) => parameter.name),
      ['page', 'pageSize', 'search', 'membershipId', 'role', 'date', 'workdayDate', 'status'],
    );
    const url = await app.getUrl();
    const login = await fetch(url + '/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Host': 'team.example',
      },
      body: JSON.stringify({
        email: 'manager@example.com',
        password: 'team-test-password',
      }),
    });
    const { token } = (await login.json()) as { token: string };
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Tenant-Host': 'team.example',
    };
    assert.equal(
      (await fetch(url + '/v1/field-operations/members', { headers })).status,
      403,
    );
    await db.query(
      'UPDATE memberships SET can_manage_customers=true WHERE id=$1',
      [owner.membershipId],
    );
    assert.equal(
      (await fetch(url + '/v1/field-operations/members', { headers })).status,
      403,
    );
    await db.query(
      'UPDATE memberships SET can_manage_field_operations=true WHERE id=$1',
      [owner.membershipId],
    );
    const members = (await (
      await fetch(url + '/v1/field-operations/members', { headers })
    ).json() as any).items as { id: string; role: string }[];
    assert.equal(members.length, 2);
    assert.ok(
      members.some(
        (member) => member.id === merchId && member.role === 'merchandiser',
      ),
    );
    const post = (body: unknown, key = randomUUID()) =>
      fetch(url + '/v1/field-operations/visits', {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': key },
        body: JSON.stringify(body),
      });
    const input = {
      membershipId: merchId,
      customerId: customer.id,
      scheduledAt: '2020-01-02T12:00:00Z',
    };
    assert.equal(
      (await post({ ...input, membershipId: foreign.membershipId })).status,
      404,
    );
    assert.equal(
      (await post({ ...input, customerId: foreignFixture.customer.id })).status,
      404,
    );
    assert.equal(
      (
        await fetch(
          url +
            `/v1/field-operations/members/${foreign.membershipId}/customers`,
          { headers },
        )
      ).status,
      404,
    );
    assert.equal(
      (
        await fetch(
          url +
            `/v1/field-operations/visits/${foreignFixture.visit.id}/evidence`,
          { headers },
        )
      ).status,
      404,
    );
    assert.equal(
      (await post({ ...input, companyId: foreign.companyId })).status,
      400,
    );
    const key = randomUUID();
    const response = await post(input, key);
    assert.equal(response.status, 200);
    const visit = (await response.json()) as {
      id: string;
      membership_id: string;
    };
    assert.equal(visit.membership_id, merchId);
    const beforeReplay = await db.query(
      'SELECT id,transition_version FROM memberships ORDER BY id',
    );
    assert.deepEqual(await (await post(input, key)).json(), visit);
    assert.deepEqual(
      await db.query(
        'SELECT id,transition_version FROM memberships ORDER BY id',
      ),
      beforeReplay,
    );
    assert.equal(
      (await post({ ...input, scheduledAt: '2020-01-03T12:00:00Z' }, key))
        .status,
      409,
    );
    const agenda = (await (
      await fetch(
        url + '/v1/field-operations/agenda?role=merchandiser&date=2020-01-02',
        { headers },
      )
    ).json() as any).items as { id: string; member_role: string }[];
    assert.deepEqual(
      agenda.map((row) => row.id),
      [visit.id],
    );
    assert.equal(agenda[0].member_role, 'merchandiser');
    const personal = (await (
      await fetch(url + '/v1/me/agenda', { headers })
    ).json() as any).items as { id: string }[];
    assert.ok(personal.every((row) => row.id !== visit.id));
    assert.equal(
      (await fetch(url + `/v1/me/visits/${visit.id}/evidence`, { headers }))
        .status,
      404,
    );
    assert.equal(
      await (
        await fetch(url + `/v1/field-operations/visits/${visit.id}/evidence`, {
          headers,
        })
      ).json(),
      null,
    );
    await db.query(
      'UPDATE memberships SET can_manage_field_operations=false WHERE id=$1',
      [owner.membershipId],
    );
    assert.equal(
      (await fetch(url + '/v1/field-operations/agenda', { headers })).status,
      403,
    );
    assert.equal((await post(input)).status, 403);
    assert.equal((await post(input, key)).status, 403);
  } finally {
    if (app) await app.close();
    await db.close();
  }
});

test('manager planning reaches Merchandiser mobile and audited closure is atomic and visible to management', async () => {
  const db = await createTestDatabase();
  let app: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const owner = await provision(
      db,
      'audit-team',
      'Audit team',
      'manager@example.com',
      'team-test-password',
      'America/Lima',
    );
    const operator = new OperatorService(db.prisma, new CredentialsService());
    const merch = await operator.addMember(
      owner.companyId,
      'merch@example.com',
      'team-test-password',
      'merchandiser',
    );
    await assert.rejects(
      operator.addMember(
        owner.companyId,
        'merch@example.com',
        'team-test-password',
        'commercial',
      ),
    );
    await assert.rejects(
      operator.addMember(
        owner.companyId,
        'merch@example.com',
        'wrong-password-value',
        'merchandiser',
      ),
    );
    await operator.grantFieldManagement(owner.companyId, owner.membershipId);
    const customerId = randomUUID();
    await db.query(
      "INSERT INTO customers(id,company_id,name,address) VALUES($1,$2,'Audit customer','Audit address')",
      [customerId, owner.companyId],
    );
    await db.query(
      'INSERT INTO customer_assignments(company_id,customer_id,membership_id) VALUES($1,$2,$3)',
      [owner.companyId, customerId, merch.membershipId],
    );
    app = await createApp(
      db.prisma,
      false,
      [],
      [{ host: 'audit.example', company: 'audit-team' }],
    );
    await app.listen(0, '127.0.0.1');
    const url = await app.getUrl();
    const login = async (email: string) => {
      const response = await fetch(url + '/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Host': 'audit.example',
        },
        body: JSON.stringify({ email, password: 'team-test-password' }),
      });
      assert.equal(response.status, 200);
      const { token } = (await response.json()) as { token: string };
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Tenant-Host': 'audit.example',
      };
    };
    const managerHeaders = await login('manager@example.com');
    const merchHeaders = await login('merch@example.com');
    const post = (
      path: string,
      body: unknown,
      headers = merchHeaders,
      key = randomUUID(),
    ) =>
      fetch(url + path, {
        method: 'POST',
        headers: { ...headers, 'Idempotency-Key': key },
        body: JSON.stringify(body),
      });
    const scheduled = await post(
      '/v1/field-operations/visits',
      {
        membershipId: merch.membershipId,
        customerId,
        scheduledAt: new Date().toISOString(),
      },
      managerHeaders,
    );
    assert.equal(scheduled.status, 200);
    const visit = (await scheduled.json()) as { id: string };
    assert.equal(
      (
        await fetch(url + '/v1/field-operations/members', {
          headers: merchHeaders,
        })
      ).status,
      403,
    );
    const customers = (await (
      await fetch(
        url + `/v1/field-operations/members/${merch.membershipId}/customers`,
        { headers: managerHeaders },
      )
    ).json() as any).items as { id: string }[];
    assert.deepEqual(
      customers.map((customer) => customer.id),
      [customerId],
    );
    const agenda = (await (
      await fetch(url + '/v1/me/agenda', { headers: merchHeaders })
    ).json() as any).items as { id: string }[];
    assert.deepEqual(
      agenda.map((row) => row.id),
      [visit.id],
    );
    assert.equal((await post('/v1/me/workdays/start', {})).status, 200);
    assert.equal(
      (await post(`/v1/me/visits/${visit.id}/check-in`, {})).status,
      200,
    );
    const snapshot = async () => {
      const tables = [
        'visits',
        'visit_evidence',
        'operations',
        'audit_log',
        'memberships',
      ];
      return Promise.all(
        tables.map((table) =>
          db.query(
            `SELECT to_jsonb(t) AS value FROM ${table} t ORDER BY to_jsonb(t)::text`,
          ),
        ),
      );
    };
    const before = await snapshot();
    const audit = {
      hasShelfStock: false,
      noStockReason: 'Producto agotado',
      brandDisplay: 'inadequate',
      pricesVisible: false,
    };
    const close = (body: unknown, key = randomUUID()) =>
      post(`/v1/me/visits/${visit.id}/close`, body, merchHeaders, key);
    const assertError = async (response: Response, code: string) => {
      assert.equal(response.status, 400);
      assert.equal(((await response.json()) as { code: string }).code, code);
    };
    await assertError(
      await close({ result: 'attended', observations: '' }),
      'audit_required',
    );
    assert.deepEqual(await snapshot(), before);
    await assertError(
      await close({ result: 'attended', observations: '', audit }),
      'audit_photo_required',
    );
    assert.deepEqual(await snapshot(), before);
    await assertError(
      await close({
        result: 'attended',
        observations: '',
        audit: { ...audit, noStockReason: ' ' },
      }),
      'invalid_audit',
    );
    assert.deepEqual(await snapshot(), before);
    await assertError(
      await close({ result: 'closed', observations: '', audit }),
      'audit_not_allowed',
    );
    assert.deepEqual(await snapshot(), before);
    const attachment = {
      mimeType: 'image/png',
      base64:
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=',
    };
    const input = {
      result: 'attended',
      observations: 'Exhibición revisada',
      audit,
      attachment,
    };
    const key = randomUUID();
    const completedResponse = await close(input, key);
    assert.equal(completedResponse.status, 200);
    const completed = (await completedResponse.json()) as {
      id: string;
      audit: unknown;
      status: string;
    };
    assert.equal(completed.status, 'completed');
    assert.deepEqual(completed.audit, audit);
    assert.deepEqual(await (await close(input, key)).json(), completed);
    const completedSnapshot = await snapshot();
    assert.equal((await close(input)).status, 409);
    assert.deepEqual(await snapshot(), completedSnapshot);
    const team = (await (
      await fetch(url + '/v1/field-operations/agenda?role=merchandiser', {
        headers: managerHeaders,
      })
    ).json() as any).items as { id: string; audit: unknown; has_evidence: boolean }[];
    assert.deepEqual(team[0].audit, audit);
    assert.equal(team[0].has_evidence, true);
    assert.deepEqual(
      await (
        await fetch(url + `/v1/field-operations/visits/${visit.id}/evidence`, {
          headers: managerHeaders,
        })
      ).json(),
      attachment,
    );
    assert.equal((await post('/v1/me/workdays/end', {})).status, 200);
    const days = (await (
      await fetch(url + '/v1/field-operations/workdays?role=merchandiser', {
        headers: managerHeaders,
      })
    ).json() as any).items as { status: string; member_email: string }[];
    assert.equal(days[0].status, 'completed');
    assert.equal(days[0].member_email, 'merch@example.com');
  } finally {
    if (app) await app.close();
    await db.close();
  }
});

test('separate management pools serialize scheduling for the same field member', async () => {
  const db = await createTestDatabase();
  const fork = db.fork();
  let appA: Awaited<ReturnType<typeof createApp>> | undefined;
  let appB: Awaited<ReturnType<typeof createApp>> | undefined;
  try {
    await migrate(db);
    const owner = await provision(
      db,
      'race-team',
      'Race team',
      'manager-a@example.com',
      'team-test-password',
    );
    const operator = new OperatorService(db.prisma, new CredentialsService());
    const managerB = await operator.addMember(
      owner.companyId,
      'manager-b@example.com',
      'team-test-password',
      'commercial',
    );
    const target = await operator.addMember(
      owner.companyId,
      'field@example.com',
      'team-test-password',
      'merchandiser',
    );
    await operator.grantFieldManagement(owner.companyId, owner.membershipId);
    await operator.grantFieldManagement(owner.companyId, managerB.membershipId);
    const { customer } = await assignVisit(
      db,
      { companyId: owner.companyId, membershipId: target.membershipId },
      '2020-01-01T12:00:00Z',
    );
    appA = await createApp(
      db.prisma,
      false,
      [],
      [{ host: 'race.example', company: 'race-team' }],
    );
    appB = await createApp(
      fork.prisma,
      false,
      [],
      [{ host: 'race.example', company: 'race-team' }],
    );
    await appA.listen(0, '127.0.0.1');
    await appB.listen(0, '127.0.0.1');
    const urls = [await appA.getUrl(), await appB.getUrl()];
    const headers = await Promise.all(
      urls.map(async (url, index) => {
        const response = await fetch(url + '/v1/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Tenant-Host': 'race.example',
          },
          body: JSON.stringify({
            email:
              index === 0 ? 'manager-a@example.com' : 'manager-b@example.com',
            password: 'team-test-password',
          }),
        });
        const { token } = (await response.json()) as { token: string };
        return {
          'Content-Type': 'application/json',
          'X-Tenant-Host': 'race.example',
          Authorization: `Bearer ${token}`,
        };
      }),
    );
    const input = {
      membershipId: target.membershipId,
      customerId: customer.id,
      scheduledAt: '2020-01-02T12:00:00Z',
    };
    const responses = await Promise.all(
      urls.map((url, index) =>
        fetch(url + '/v1/field-operations/visits', {
          method: 'POST',
          headers: { ...headers[index], 'Idempotency-Key': randomUUID() },
          body: JSON.stringify(input),
        }),
      ),
    );
    assert.deepEqual(
      responses.map((response) => response.status).sort(),
      [200, 409],
    );
    const rows = await db.query(
      'SELECT * FROM visits WHERE membership_id=$1 AND scheduled_at=$2',
      [target.membershipId, input.scheduledAt],
    );
    assert.equal(rows.length, 1);
    const receipts = await db.query(
      'SELECT membership_id FROM operations WHERE company_id=$1 AND fingerprint IS NOT NULL',
      [owner.companyId],
    );
    assert.equal(receipts.length, 1);
    assert.ok(
      [owner.membershipId, managerB.membershipId].includes(
        receipts[0].membership_id,
      ),
    );
    await db.query('UPDATE memberships SET active=false WHERE id=$1', [
      target.membershipId,
    ]);
    const rejected = await fetch(urls[0] + '/v1/field-operations/visits', {
      method: 'POST',
      headers: { ...headers[0], 'Idempotency-Key': randomUUID() },
      body: JSON.stringify({ ...input, scheduledAt: '2020-01-03T12:00:00Z' }),
    });
    assert.equal(rejected.status, 404);
  } finally {
    if (appB) await appB.close();
    if (appA) await appA.close();
    await fork.close();
    await db.close();
  }
});
