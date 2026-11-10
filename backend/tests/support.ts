import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Pool, QueryResultRow } from 'pg';
import { z } from 'zod';
import { PrismaService } from '../src/database/prisma.service';
import { AuthService } from '../src/modules/identity/services/auth.service';
import { CredentialsService } from '../src/modules/identity/services/credentials.service';
import { OperatorService } from '../src/modules/identity/services/operator.service';
import { FieldCommandsService } from '../src/modules/field-operations/services/field-commands.service';
import { WorkdaysService } from '../src/modules/field-operations/workdays/services/workdays.service';
import { VisitsService } from '../src/modules/field-operations/visits/services/visits.service';
import { AgendaService } from '../src/modules/field-operations/agenda/services/agenda.service';
import { CustomersService } from '../src/modules/customers/services/customers.service';
import { credentialsSchema } from '../src/modules/identity/dto/login.dto';
import {
  closeSchema,
  idSchema,
  scheduleSchema,
} from '../src/modules/field-operations/visits/dto/visit.dto';

const run = promisify(execFile);

function testUrl(): URL {
  const value = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!value)
    throw new Error(
      'TEST_DATABASE_URL or DATABASE_URL is required for isolated PostgreSQL tests',
    );
  const url = new URL(value);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  ) {
    throw new Error('Tests require an explicit local PostgreSQL URL');
  }
  url.searchParams.delete('schema');
  return url;
}

/** Raw SQL is confined to fixture seeding/assertions; production uses this real Prisma client. */
export class TestDatabase {
  readonly prisma: PrismaService;
  private readonly fixtures: Pool;
  constructor(
    readonly url: URL,
    readonly schema: string,
    private readonly ownsSchema: boolean,
  ) {
    if (!/^test_[a-f0-9]{32}$/.test(schema))
      throw new Error('Unsafe test schema');
    this.prisma = new PrismaService(url.toString(), schema);
    this.fixtures = new Pool({
      connectionString: url.toString(),
      max: 2,
      options: `-csearch_path=${schema}`,
    });
  }
  async query<T extends QueryResultRow = Record<string, any>>(
    sql: string,
    params: any[] = [],
  ): Promise<T[]> {
    return (await this.fixtures.query<T>(sql, params)).rows;
  }
  fork(): TestDatabase {
    return new TestDatabase(this.url, this.schema, false);
  }
  async close(): Promise<void> {
    await this.prisma.$disconnect();
    await this.fixtures.end();
    if (this.ownsSchema) {
      const operator = new Pool({
        connectionString: this.url.toString(),
        max: 1,
      });
      try {
        await operator.query(`DROP SCHEMA "${this.schema}" CASCADE`);
      } finally {
        await operator.end();
      }
    }
  }
}

export async function createTestDatabase(): Promise<TestDatabase> {
  const url = testUrl();
  const schema = 'test_' + randomUUID().replaceAll('-', '');
  const operator = new Pool({ connectionString: url.toString(), max: 1 });
  try {
    await operator.query(`CREATE SCHEMA "${schema}"`);
  } finally {
    await operator.end();
  }
  return new TestDatabase(url, schema, true);
}

export async function migrate(database: TestDatabase): Promise<void> {
  await prismaMigration(database, ['deploy']);
}

export async function prismaMigration(
  database: TestDatabase,
  args: string[],
): Promise<void> {
  const url = new URL(database.url);
  url.searchParams.set('schema', database.schema);
  try {
    await run(
      process.execPath,
      [require.resolve('prisma/build/index.js'), 'migrate', ...args],
      {
        cwd: process.cwd(),
        env: { ...process.env, DATABASE_URL: url.toString() },
        timeout: 60000,
      },
    );
  } catch {
    throw new Error('Prisma migration failed in the isolated test schema');
  }
}

export function createIdentity(database: TestDatabase) {
  const auth = new AuthService(database.prisma, new CredentialsService());
  return {
    login: (input: { company: string; email: string; password: string }) =>
      auth.login(
        z
          .string()
          .regex(/^[a-z0-9-]{1,64}$/)
          .parse(input.company),
        credentialsSchema.parse({
          email: input.email,
          password: input.password,
        }),
      ),
    authenticate: (token: string, company?: string) =>
      auth.authenticate(token, company),
    logout: auth.logout.bind(auth),
  };
}

export function provision(
  database: TestDatabase,
  slug: string,
  name: string,
  email: string,
  password: string,
  timeZone = 'UTC',
) {
  return new OperatorService(
    database.prisma,
    new CredentialsService(),
  ).provision(slug, name, email, password, timeZone);
}

export function createFieldOperations(database: TestDatabase) {
  const commands = new FieldCommandsService(database.prisma);
  const workdays = new WorkdaysService(database.prisma, commands);
  const visits = new VisitsService(database.prisma, commands);
  const agenda = new AgendaService(database.prisma);
  const customers = new CustomersService(database.prisma);
  return {
    customers: customers.assigned.bind(customers),
    agenda: agenda.list.bind(agenda),
    currentDay: workdays.current.bind(workdays),
    startDay: workdays.start.bind(workdays),
    endDay: workdays.end.bind(workdays),
    checkIn: (
      principal: Parameters<VisitsService['checkIn']>[0],
      key: string,
      id: string,
    ) => visits.checkIn(principal, key, idSchema.parse(id)),
    closeVisit: (
      principal: Parameters<VisitsService['close']>[0],
      key: string,
      id: string,
      input: unknown,
    ) =>
      visits.close(
        principal,
        key,
        idSchema.parse(id),
        closeSchema.parse(input),
      ),
    scheduleVisit: (
      principal: Parameters<VisitsService['schedule']>[0],
      key: string,
      input: unknown,
    ) => visits.schedule(principal, key, scheduleSchema.parse(input)),
    evidence: visits.evidence.bind(visits),
  };
}

export async function assignVisit(
  db: TestDatabase,
  owner: { companyId: string; membershipId: string },
  at = new Date().toISOString(),
) {
  const [customer] = await db.query(
    'INSERT INTO customers(id,company_id,name,address) VALUES($1,$2,$3,$4) RETURNING *',
    [randomUUID(), owner.companyId, 'Pet Market', 'Main street'],
  );
  await db.query(
    'INSERT INTO customer_assignments(company_id,customer_id,membership_id) VALUES($1,$2,$3)',
    [owner.companyId, customer.id, owner.membershipId],
  );
  const [visit] = await db.query(
    'INSERT INTO visits(id,company_id,membership_id,customer_id,scheduled_at) VALUES($1,$2,$3,$4,$5) RETURNING *',
    [randomUUID(), owner.companyId, owner.membershipId, customer.id, at],
  );
  return { customer, visit };
}
