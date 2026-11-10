import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, loadPolicy } from '../src/config/environment';
import { loadTenantDomains } from '../src/config/tenant-domains';

test('configuration rejects invalid values instead of silently replacing them', () => {
  assert.throws(() => loadConfig({}));
  assert.throws(() => loadConfig({ DATABASE_URL: 'http://example.com' }));
  assert.throws(() =>
    loadConfig({
      DATABASE_URL: 'postgresql://localhost/test',
      PORT: 'invalid',
    }),
  );
  assert.throws(() => loadPolicy({ LOGIN_MAX_FAILURES: '0' }));
  assert.throws(() =>
    loadConfig({
      DATABASE_URL: 'postgresql://localhost/test',
      CORS_ORIGINS: '*',
    }),
  );
  assert.equal(
    loadConfig({
      DATABASE_URL: 'postgresql://localhost/test',
      PORT: '4001',
      TENANT_DOMAINS: '[{"host":"localhost","company":"local"}]',
    }).port,
    4001,
  );
});

test('tenant domains are explicit, exact and unique with no default company', () => {
  const entries = [
    { host: 'localhost', company: 'local' },
    { host: 'a.example.com', company: 'alpha' },
  ];
  assert.deepEqual(loadTenantDomains(JSON.stringify(entries)), entries);
  for (const invalid of [
    undefined,
    '{}',
    '[]',
    'broken',
    JSON.stringify([entries[0], entries[0]]),
    ...[
      '*.example.com',
      'https://example.com',
      'example.com:3001',
      'EXAMPLE.COM',
      'example.com/path',
      'example.com,other.com',
    ].map((host) => JSON.stringify([{ host, company: 'alpha' }])),
  ]) {
    assert.throws(() => loadTenantDomains(invalid));
  }
});
