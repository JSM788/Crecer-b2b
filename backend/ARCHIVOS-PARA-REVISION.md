# Archivos solicitados para revisión

## src/modules/identity/http/identity.facade.ts

```ts
import type { Login } from '../application/login';
import type { Authenticate } from '../application/authenticate';
import type { Logout } from '../application/logout';
import type { Provision } from '../application/provision';
import type { Principal } from '../domain/principal';
import { companyNameSchema, loginSchema } from './identity.schemas';

export class IdentityFacade {
  constructor(private readonly loginUseCase: Login, private readonly authenticateUseCase: Authenticate,
    private readonly logoutUseCase: Logout, private readonly provisionUseCase: Provision) {}

  async login(input: unknown) { return this.loginUseCase.execute(loginSchema.parse(input)); }
  authenticate(token: string, company?: string) { return this.authenticateUseCase.execute(token, company); }
  logout(principal: Principal) { return this.logoutUseCase.execute(principal); }

  async provision(slug: string, name: string, email: string, password: string, timeZone = 'UTC') {
    const input = loginSchema.parse({ company: slug, email, password });
    return this.provisionUseCase.execute({ slug: input.company, name: companyNameSchema.parse(name),
      email: input.email, password: input.password, timeZone });
  }
}
```

## src/modules/field-operations/field-operations.factory.ts

```ts
import { Database } from '../../platform/database';
import { ListAssignedCustomers } from '../customers/application/list-assigned-customers';
import { PostgresCustomerRepository } from '../customers/infrastructure/postgres-customer-repository';
import { Principal } from '../identity/domain/principal';
import { GetAgenda } from './agenda/application/get-agenda';
import { PostgresAgendaRepository } from './agenda/infrastructure/postgres-agenda-repository';
import { PostgresCommandExecutor } from './infrastructure/postgres-command-executor';
import { CheckInVisit } from './visits/application/check-in-visit';
import { CloseVisit } from './visits/application/close-visit';
import { closeSchema, idSchema, scheduleSchema } from './visits/http/visit.schemas';
import { ScheduleVisit } from './visits/application/schedule-visit';
import { GetVisitEvidence } from './visits/application/get-visit-evidence';
import { PostgresVisitRepository } from './visits/infrastructure/postgres-visit-repository';
import { PostgresVisitEvidenceRepository } from './visits/infrastructure/postgres-visit-evidence-repository';
import { EndWorkday } from './workdays/application/end-workday';
import { GetCurrentWorkday } from './workdays/application/get-current-workday';
import { StartWorkday } from './workdays/application/start-workday';
import { PostgresWorkdayRepository } from './workdays/infrastructure/postgres-workday-repository';

export function createFieldOperations(database: Database) {
  const customers = new ListAssignedCustomers(new PostgresCustomerRepository(database));
  const agenda = new GetAgenda(new PostgresAgendaRepository(database));
  const currentDay = new GetCurrentWorkday(new PostgresWorkdayRepository(database));
  const commands = new PostgresCommandExecutor(database);
  const startDay = new StartWorkday(commands);
  const endDay = new EndWorkday(commands);
  const checkIn = new CheckInVisit(commands);
  const closeVisit = new CloseVisit(commands);
  const scheduleVisit = new ScheduleVisit(commands);
  const evidence = new GetVisitEvidence(new PostgresVisitRepository(database), new PostgresVisitEvidenceRepository(database));

  return {
    scheduleVisit: (principal: Principal, key: string, input: unknown) => scheduleVisit.execute(principal, key, scheduleSchema.parse(input)),
    evidence: (principal: Principal, id: string) => evidence.execute(principal, idSchema.parse(id)),
    customers: (principal: Principal) => customers.execute(principal),
    agenda: (principal: Principal) => agenda.execute(principal),
    currentDay: (principal: Principal) => currentDay.execute(principal),
    startDay: (principal: Principal, key: string) => startDay.execute(principal, key),
    endDay: (principal: Principal, key: string) => endDay.execute(principal, key),
    checkIn: (principal: Principal, key: string, id: string) =>
      checkIn.execute(principal, key, idSchema.parse(id)),
    closeVisit: (principal: Principal, key: string, id: string, input: unknown) =>
      closeVisit.execute(principal, key, idSchema.parse(id), closeSchema.parse(input)),
  };
}

export type FieldOperations = ReturnType<typeof createFieldOperations>;
```

## tests/architecture.test.ts

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import ts from 'typescript';

async function sources(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sources(path) : Promise.resolve(path.endsWith('.ts') ? [path] : []);
  }));
  return nested.flat();
}

test('domain and application depend on ports and domain rather than HTTP, SQL or infrastructure', async () => {
  const files = (await sources('src/modules')).filter(path => /[\\/](domain|application)[\\/]/.test(path));
  assert.ok(files.length > 0, 'The application must have actual domain/application implementations');
  for (const path of files) {
    const source = await readFile(path, 'utf8');
    const tree = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
    for (const statement of tree.statements) {
      if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
      const dependency = statement.moduleSpecifier.text;
      assert.ok(!/@nestjs|^pg$|node:|[\\/]infrastructure[\\/]|platform\/database|[\\/]http[\\/]/.test(dependency), `${path} depends on adapter ${dependency}`);
    }
    assert.ok(!/\b(?:SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+\w+\s+SET)\b/is.test(source), `${path} contains SQL outside its repository`);
  }
});
```

## src/modules/field-operations/visits/http/visits.controller.ts

```ts
import { Body, Controller, Get, HttpCode, Param, Post, Res, UseGuards } from '@nestjs/common';
import { z } from 'zod';
import { Principal } from '../../../identity/domain/principal';
import { CurrentPrincipal } from '../../../identity/http/principal.decorator';
import { SessionGuard } from '../../../identity/http/session.guard';
import { ZodValidationPipe } from '../../../../platform/http/zod-validation.pipe';
import { emptyBodySchema } from '../../../../platform/http/request.schemas';
import { OperationKey } from '../../../../platform/http/operation-key.decorator';
import { CheckInVisit } from '../application/check-in-visit';
import { CloseVisit } from '../application/close-visit';
import { closeSchema, idSchema, scheduleSchema } from './visit.schemas';
import { ScheduleVisit } from '../application/schedule-visit';
import { GetVisitEvidence } from '../application/get-visit-evidence';
import { JsonResponse } from '../../../../platform/http/http-context';

export type CloseVisitDto = z.infer<typeof closeSchema>;

@Controller('v1/me/visits')
@UseGuards(SessionGuard)
export class VisitsController {
  constructor(private readonly checkInVisit: CheckInVisit, private readonly closeVisit: CloseVisit,
    private readonly scheduleVisit: ScheduleVisit, private readonly getEvidence: GetVisitEvidence) {}

  @Post()
  @HttpCode(200)
  schedule(@CurrentPrincipal() principal: Principal, @OperationKey() key: string, @Body(new ZodValidationPipe(scheduleSchema)) body: z.infer<typeof scheduleSchema>) {
    return this.scheduleVisit.execute(principal, key, body);
  }

  @Get(':id/evidence')
  async evidence(@CurrentPrincipal() principal: Principal, @Param('id', new ZodValidationPipe(idSchema)) id: string, @Res() response: JsonResponse): Promise<void> {
    response.json(await this.getEvidence.execute(principal, id));
  }

  @Post(':id/check-in')
  @HttpCode(200)
  checkIn(@CurrentPrincipal() principal: Principal, @Param('id', new ZodValidationPipe(idSchema)) id: string, @OperationKey() key: string, @Body(new ZodValidationPipe(emptyBodySchema)) _input: Record<string, never>) {
    return this.checkInVisit.execute(principal, key, id);
  }

  @Post(':id/close')
  @HttpCode(200)
  close(@CurrentPrincipal() principal: Principal, @Param('id', new ZodValidationPipe(idSchema)) id: string, @OperationKey() key: string, @Body(new ZodValidationPipe(closeSchema)) body: CloseVisitDto) {
    return this.closeVisit.execute(principal, key, id, body);
  }
}
```

## src/modules/field-operations/visits/http/visit.schemas.ts

```ts
import { z } from 'zod';

export const idSchema = z.uuid();
export const scheduleSchema = z.object({ customerId: idSchema, scheduledAt: z.iso.datetime({ offset: true }) }).strict();
export const evidenceSchema = z.object({
  mimeType: z.enum(['image/jpeg', 'image/png', 'image/webp']),
  base64: z.string().min(1).max(1398104),
}).strict();

const attachmentSchema = evidenceSchema.superRefine((evidence, context) => {
  const invalid = () => context.addIssue({ code: 'custom', message: 'Evidence must be a canonical image of at most 1 MiB matching its MIME type.' });
  if (evidence.base64.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(evidence.base64)) return invalid();
  const bytes = Buffer.from(evidence.base64, 'base64');
  if (bytes.length < 1 || bytes.length > 1048576 || bytes.toString('base64') !== evidence.base64) return invalid();
  const matches = evidence.mimeType === 'image/png'
    ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : evidence.mimeType === 'image/jpeg'
      ? bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
      : bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!matches) invalid();
});
export const closeSchema = z.object({
  result: z.enum(['attended', 'closed', 'unavailable']),
  observations: z.string().trim().max(4000),
  attachment: attachmentSchema.optional(),
}).strict();
```

## Schema de respuesta: src/contract.ts

Extracto literal: definición de visit, sus dependencias y rutas que la usan. La respuesta de evidencia usa evidenceSchema.nullable(), definido en visit.schemas.ts, incluido arriba. El controller no declara ni aplica un schema de salida propio.

```ts
const id = z.uuid();
const timestamp = z.iso.datetime({offset:true});
const visit = z.object({id, company_id:id, membership_id:id, customer_id:id, scheduled_at:timestamp, workday_id:id.nullable(), status:z.enum(['pending','active','completed']), arrived_at:timestamp.nullable(), ended_at:timestamp.nullable(), result:z.enum(['attended','closed','unavailable']).nullable(), observations:z.string().nullable()});
  {method:'post',path:'/me/visits/{id}/check-in',input:empty,schema:visit,key:true},
  {method:'post',path:'/me/visits/{id}/close',input:closeSchema,schema:visit,key:true},
  {method:'post',path:'/me/visits',input:scheduleSchema,schema:visit,key:true},
  {method:'get',path:'/me/visits/{id}/evidence',schema:evidenceSchema.nullable()},
```
