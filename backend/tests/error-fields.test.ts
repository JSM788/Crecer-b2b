import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { ArgumentsHost } from '@nestjs/common';
import { z } from 'zod';
import { ApplicationError, errorMessages, isUniqueConstraint, rejectField } from '../src/common/errors/application-error';
import { ApiExceptionFilter } from '../src/common/filters/api-exception.filter';
import { PlatformService } from '../src/modules/platform/services/platform.service';
import { TeamService } from '../src/modules/team/services/team.service';
import { FieldManagementService } from '../src/modules/field-operations/management/services/field-management.service';
import { CustomersService } from '../src/modules/customers/services/customers.service';

function serialize(error: unknown) {
  let status = 0;
  let body: unknown;
  const response = {
    status(value: number) { status = value; return this; },
    json(value: unknown) { body = value; },
  };
  const host = { switchToHttp: () => ({ getRequest: () => ({ requestId: 'request-1' }), getResponse: () => response }) };
  new ApiExceptionFilter().catch(error, host as unknown as ArgumentsHost);
  return { status, body: body as { code: string; message: string; requestId: string; details?: { path: (string | number)[]; code: string; message: string }[] } };
}

test('field rejections preserve the business envelope; ordinary rejections omit details', () => {
  assert.throws(() => rejectField('platform_identity_exists', ['manager', 'email']), error => {
    assert.deepEqual(serialize(error), { status: 409, body: {
      code: 'platform_identity_exists', message: errorMessages.platform_identity_exists, requestId: 'request-1',
      details: [{ path: ['manager', 'email'], code: 'platform_identity_exists', message: errorMessages.platform_identity_exists }],
    } });
    return true;
  });
  assert.deepEqual(serialize(new ApplicationError('platform_forbidden')), { status: 403, body: {
    code: 'platform_forbidden', message: errorMessages.platform_forbidden, requestId: 'request-1',
  } });
});

test('Zod serializes every nested and numeric path with stable codes without input', () => {
  const schema = z.object({ manager: z.object({ email: z.email() }), rows: z.array(z.object({ name: z.string().min(1) })) });
  const result = schema.safeParse({ manager: { email: 'private-submitted-value' }, rows: [{ name: '' }] });
  assert.equal(result.success, false);
  if (result.success) return;
  const response = serialize(result.error);
  assert.equal(response.status, 400);
  assert.equal(response.body.code, 'invalid_request');
  assert.deepEqual(response.body.details?.map(({ path, code }) => ({ path, code })), [
    { path: ['manager', 'email'], code: 'invalid_format' }, { path: ['rows', 0, 'name'], code: 'too_small' },
  ]);
  assert.equal(JSON.stringify(response.body).includes('private-submitted-value'), false);
});

test('only the known customer RUC constraint adds a field to the existing generic conflict', () => {
  const metas = [
    { modelName: 'Customer', target: ['companyId', 'ruc'] },
    { target: 'customers_company_ruc' },
    { modelName: 'Customer', driverAdapterError: { cause: { constraint: { index: 'customers_company_ruc' } } } },
  ];
  for (const meta of metas) {
    const response = serialize({ code: 'P2002', meta });
    assert.equal(response.status, 409);
    assert.equal(response.body.code, 'conflict');
    assert.deepEqual(response.body.details, [{ path: ['ruc'], code: 'duplicate', message: 'A customer already exists with this RUC.' }]);
  }
  for (const meta of [
    { modelName: 'Customer', target: ['companyId', 'id'] },
    { modelName: 'Other', target: ['companyId', 'ruc'] },
    { target: ['companyId', 'ruc'] },
    { target: 'unknown_constraint', message: 'customers_company_ruc' },
  ]) {
    const response = serialize({ code: 'P2002', meta });
    assert.equal(response.status, 409);
    assert.equal(response.body.details, undefined);
  }
  assert.equal(isUniqueConstraint({ code: 'P2002', meta: { modelName: 'User', target: ['email'] } }, 'User', ['email'], 'users_email_key'), true);
  assert.equal(isUniqueConstraint({ code: 'P2002', meta: { modelName: 'Operation', target: ['email'] } }, 'User', ['email'], 'users_email_key'), false);
});

test('unknown server errors do not expose their message or metadata', () => {
  const error = Object.assign(new Error('private password and SQL'), { meta: { password: 'private' } });
  const response = serialize(error);
  assert.equal(response.status, 500);
  assert.equal(response.body.code, 'internal_error');
  assert.equal(response.body.details, undefined);
  assert.equal(JSON.stringify(response.body).includes('private'), false);
});

const principal = {} as never;
function commands(tx: unknown) {
  return { execute: async (...args: unknown[]) => (args[4] as (tx: unknown) => unknown)(tx) };
}
async function expectPath(action: () => unknown, path: (string | number)[]) {
  await assert.rejects(async () => action(), (error: unknown) => {
    assert.ok(error instanceof ApplicationError);
    assert.deepEqual(error.details?.[0].path, path);
    assert.equal(error.details?.[0].code, error.code);
    return true;
  });
}

test('company creation uses manager.email while member creation and editing use email', async () => {
  const tx = {
    company: { findUnique: async () => ({ id: 'company' }), findUniqueOrThrow: async () => ({ status: 'active' }) },
    user: { findUnique: async () => ({ id: 'duplicate' }) },
    membership: { updateMany: async () => ({}), findFirst: async () => ({ userId: 'original', user: { isPlatformOwner: false } }) },
  };
  const service = new PlatformService(
    { transaction: async (callback: (tx: unknown) => unknown) => callback(tx) } as never,
    { requireOwner: async () => undefined } as never, commands(tx) as never,
    { isReserved: () => true } as never, {} as never, {} as never, {} as never,
  );
  await expectPath(() => service.createCompany(principal, 'key', { manager: { email: 'duplicate@example.test' } } as never), ['manager', 'email']);
  await expectPath(() => service.createMember(principal, 'key', 'company', { email: 'duplicate@example.test' } as never), ['email']);
  await expectPath(() => service.editMember(principal, 'key', 'company', 'member', { email: 'duplicate@example.test' } as never), ['email']);
  tx.user.findUnique = async () => null as never;
  await expectPath(() => service.createCompany(principal, 'key', { manager: { email: 'new@example.test' }, hostname: 'reserved.example.test' } as never), ['hostname']);
});

test('team duplicate identity is attached to email', async () => {
  const tx = {
    session: { findFirst: async () => ({}) },
    membership: { updateMany: async () => ({}), findFirst: async () => ({ userId: 'original', user: {} }), count: async () => 0 },
    operation: { findUnique: async () => null },
    user: { findUnique: async () => ({ id: 'duplicate' }) },
  };
  const service = new TeamService({ transaction: async (callback: (tx: unknown) => unknown) => callback(tx) } as never, {} as never, {} as never);
  await expectPath(() => service.editProfile({ companyId: 'company', membershipId: 'manager' } as never, 'key', 'member', { email: 'duplicate@example.test' } as never), ['email']);
});

test('scheduling maps membership, customer and occupied slot to the actual input fields', async () => {
  const tx = {
    membership: { findFirst: async () => null as unknown },
    customerAssignment: { findUnique: async () => null as unknown },
    workday: { findFirst: async () => null as unknown },
    visit: { findFirst: async () => ({}) },
  };
  const service = new FieldManagementService({} as never, commands(tx) as never);
  const input = { membershipId: 'member', customerId: 'customer', scheduledAt: '2026-11-04T12:00:00Z' };
  const actor = { companyId: 'company', timeZone: 'America/Lima' } as never;
  await expectPath(() => service.schedule(actor, 'key', input), ['membershipId']);
  tx.membership.findFirst = async () => ({ role: 'commercial' });
  await expectPath(() => service.schedule(actor, 'key', input), ['customerId']);
  tx.customerAssignment.findUnique = async () => ({});
  await expectPath(() => service.schedule(actor, 'key', input), ['scheduledAt']);
  tx.workday.findFirst = async () => ({});
  await expectPath(() => service.schedule(actor, 'key', input), ['scheduledAt']);
});

test('customer assignee failures identify the creation or assignment field', async () => {
  const tx = {
    session: { findFirst: async () => ({}) },
    membership: { updateMany: async () => ({ count: 1 }), findFirst: async () => null as unknown },
    customer: { updateMany: async () => ({ count: 0 }) },
  };
  const service = new CustomersService({ transaction: async (callback: (tx: unknown) => unknown) => callback(tx) } as never);
  const actor = { companyId: 'company', membershipId: 'manager', permissions: ['manage_customers'] } as never;
  await expectPath(() => service.create(actor, { commercialMembershipId: 'missing' } as never), ['commercialMembershipId']);
  await expectPath(() => service.assign(actor, { membershipId: 'missing', customerIds: ['customer'] }), ['membershipId']);
  tx.membership.findFirst = async () => ({ id: 'member', role: 'commercial' });
  await expectPath(() => service.assign(actor, { membershipId: 'member', customerIds: ['missing'] }), ['customerIds']);
});
