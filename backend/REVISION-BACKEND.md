# Backend Salinas: información para evaluación externa

Fecha de inspección: 26 de octubre de 2026. Estado observado antes de migrar a Prisma.

Este documento contiene datos del código existente. No incluye recomendaciones ni una propuesta de arquitectura. Las rutas son relativas a `backend/`. No contiene credenciales ni código fuente completo.

## Estado y dependencias

| Elemento | Estado observado |
|---|---|
| Framework | NestJS 11, adaptador Express |
| Lenguaje | TypeScript ~5.9.3; `strict: true` |
| Ejecución | Node >=22; CommonJS; target ES2022 |
| Gestor | pnpm 12.14.0 |
| Persistencia | PostgreSQL mediante `pg` ^8.16.0; sin ORM |
| Validación | Zod ^4.0.0 |
| Contrato HTTP | OpenAPI generado manualmente desde `src/contract.ts` |
| Dependencias restantes | `reflect-metadata` ^0.2.2, `rxjs` ^7.8.2 |
| Desarrollo | `@electric-sql/pglite` ^0.3.0, `@types/node` ^24.0.0, `@types/pg` ^8.15.0 |
| Volumen | 78 archivos `.ts` en `src/`; 11 declaraciones `@Module` |

## Estructura

Árbol condensado: muestra ubicaciones y categorías existentes, no todos los archivos.

```text
backend/
├── src/
│   ├── main.ts
│   ├── app.ts
│   ├── app.module.ts
│   ├── cli.ts
│   ├── contract.ts
│   ├── modules/
│   │   ├── identity/
│   │   │   ├── identity.module.ts
│   │   │   ├── identity.factory.ts
│   │   │   ├── application/ports/
│   │   │   ├── domain/
│   │   │   ├── http/
│   │   │   └── infrastructure/
│   │   ├── customers/
│   │   │   ├── customers.module.ts
│   │   │   ├── application/ports/
│   │   │   ├── domain/
│   │   │   ├── http/
│   │   │   └── infrastructure/
│   │   ├── field-operations/
│   │   │   ├── field-operations.module.ts
│   │   │   ├── field-operations.factory.ts
│   │   │   ├── application/ports/
│   │   │   ├── infrastructure/
│   │   │   │   └── field-command.module.ts
│   │   │   ├── agenda/
│   │   │   ├── workdays/
│   │   │   └── visits/
│   │   └── system/system.module.ts
│   ├── platform/
│   │   ├── config.ts
│   │   ├── database.ts
│   │   ├── logging.ts
│   │   ├── http/
│   │   ├── persistence/
│   │   └── tenancy/
│   └── shared/domain/application-error.ts
├── migrations/
├── contracts/
└── tests/
```

`agenda`, `workdays` y `visits` tienen cada uno su `.module.ts`, `application/ports/`, `domain/`, `http/` e `infrastructure/`.

## Módulos y composición

Los conteos de archivos son recursivos y se superponen entre padres e hijos. Los casos de uso son clases propias en `application/`, sin incluir `ports/` ni casos de submódulos.

| Módulo: ruta desde `src/` | TS | Casos propios | Composición / fachada |
|---|---:|---:|---|
| `app.module.ts` | 78 | 0 | `register()` importa módulos |
| `modules/identity/identity.module.ts` | 18 | 4 | Factory externa, `useFactory`, `IdentityFacade` |
| `modules/customers/customers.module.ts` | 6 | 1 | `useFactory` inline; sin fachada |
| `modules/field-operations/field-operations.module.ts` | 34 | 0 | Importa tres submódulos; existe factory externa separada |
| `modules/field-operations/agenda/agenda.module.ts` | 6 | 1 | `useFactory` inline |
| `modules/field-operations/workdays/workdays.module.ts` | 10 | 4 | `useFactory` inline |
| `modules/field-operations/visits/visits.module.ts` | 13 | 4 | `useFactory` inline |
| `modules/field-operations/infrastructure/field-command.module.ts` | 2 | 0 | `useFactory` inline; exporta token `FIELD_COMMANDS` |
| `modules/system/system.module.ts` | 1 | 0 | Incluye la clase `SystemController` en el mismo archivo |
| `platform/persistence/persistence.module.ts` | 2 | 0 | Global; comparte `DATABASE` mediante `useValue` |
| `platform/tenancy/tenant-routing.module.ts` | 2 | 0 | Global; configuración mediante `useValue`; exporta `TenantResolver` |

Casos de uso encontrados:

- Identity: `Login`, `Authenticate`, `Logout`, `Provision`.
- Customers: `ListAssignedCustomers`.
- Agenda: `GetAgenda`.
- Workdays: `StartWorkday`, `EndWorkday`, `GetCurrentWorkday`, `ListWorkdays`.
- Visits: `ScheduleVisit`, `CheckInVisit`, `CloseVisit`, `GetVisitEvidence`.

Los archivos de dominio contienen interfaces, tipos y funciones de reglas. No se encontraron clases de entidad, value object ni errores locales en esos directorios. El error compartido es `ApplicationError`.

No se encontró un CRUD completo de creación, lectura, actualización y eliminación. `customers` expone lectura de clientes asignados.

## Recorrido de peticiones y acceso a datos

- Inicio: `main.ts` crea `PostgresDatabase`; `app.ts` crea Nest con `AppModule.register()`.
- Identity: `AuthController → IdentityFacade → Login → IdentityRepository / IdentityUnitOfWork → implementación PostgreSQL`.
- Customers: `CustomersController → ListAssignedCustomers → PostgresCustomerRepository`.
- Operaciones de escritura de campo: `controller → caso de uso → PostgresCommandExecutor → repositorios dentro de una transacción`.
- Controllers: ubicados en `modules/*/http/` y submódulos; `SystemController` está dentro de `system.module.ts`.
- Validaciones: schemas Zod en archivos `http/*schemas.ts`, un pipe compartido y validaciones adicionales dentro de fachada/ejecutor.
- Contrato: `src/contract.ts` mantiene una lista de rutas y construye el documento OpenAPI; los controllers declaran sus rutas con decoradores Nest.

`src/platform/database.ts` crea un `pg.Pool`. El módulo global de persistencia comparte la instancia bajo el token `DATABASE`. `transaction()` obtiene un cliente, ejecuta `BEGIN`, callback y `COMMIT`; ante error ejecuta `ROLLBACK` y libera el cliente en `finally`.

Identity tiene `PostgresIdentityUnitOfWork`. El ejecutor de campo bloquea la membresía con `FOR UPDATE`, verifica sesión, consulta recibos de idempotencia y guarda estado, recibo y auditoría dentro de la misma transacción.

### SQL manual

10 archivos de `src/` contienen SQL manual:

```text
src/main.ts
src/platform/database.ts
src/platform/persistence/operator-bootstrap.repository.ts
src/modules/identity/infrastructure/postgres-identity.repository.ts
src/modules/customers/infrastructure/postgres-customer-repository.ts
src/modules/field-operations/agenda/infrastructure/postgres-agenda-repository.ts
src/modules/field-operations/infrastructure/postgres-command-executor.ts
src/modules/field-operations/workdays/infrastructure/postgres-workday-repository.ts
src/modules/field-operations/visits/infrastructure/postgres-visit-repository.ts
src/modules/field-operations/visits/infrastructure/postgres-visit-evidence-repository.ts
```

Migraciones: `001-foundation.sql` y `002-visit-planning-evidence.sql`. El runner está en `platform/database.ts`: lista explícita de archivos, tabla `schema_migrations` y bloqueo asesor transaccional. El conteo anterior no incluye SQL de migraciones o tests.

## Errores y dependencias entre módulos

`shared/domain/application-error.ts` define códigos, mensajes, `ApplicationError` y `reject()`. `platform/http/api-exception.filter.ts` convierte errores de aplicación a estados HTTP; también trata Zod, tamaño de cuerpo, conflicto PostgreSQL `23505`, `HttpException` y errores inesperados. `app.ts` lo registra globalmente.

Única importación encontrada en `src/` de `HttpException` o clases derivadas: `platform/http/api-exception.filter.ts:1`. No se encontraron importaciones de excepciones HTTP derivadas en servicios/casos de uso/repositorios de `src/`.

Cruces existentes, con ubicaciones representativas:

| Origen | Destino importado | Archivo de ejemplo |
|---|---|---|
| Customers | Tipos, decorator y guard de identity | `modules/customers/http/customers.controller.ts:2–4` |
| Agenda | Tipo `Visit` de visits | `modules/field-operations/agenda/domain/agenda-entry.ts:1` |
| Visits | Regla de workdays | `modules/field-operations/visits/application/check-in-visit.ts:3` |
| Puertos comunes de campo | Puertos de visits y workdays | `modules/field-operations/application/ports/command-executor.ts:2–4` |
| Ejecutor PostgreSQL de campo | Repositorios de visits y workdays | `modules/field-operations/infrastructure/postgres-command-executor.ts:7–9` |
| Factory de campo | Casos/repositorios de customers y submódulos; schemas de visits | `modules/field-operations/field-operations.factory.ts` |
| Contrato raíz | Schemas HTTP de identity y visits | `src/contract.ts:4–5` |
| Identity y módulos funcionales | Tokens/resolvedor de módulos de plataforma | `identity.module.ts`, `auth.controller.ts` y `.module.ts` funcionales |

La tabla anterior es representativa; no es el inventario exhaustivo de imports.

## Tamaño de archivos

Los 15 `.ts` más largos de `src/`. Líneas físicas, incluyendo comentarios y líneas vacías.

| Ruta desde `src/` | Líneas |
|---|---:|
| `modules/identity/infrastructure/postgres-identity.repository.ts` | 88 |
| `modules/field-operations/visits/infrastructure/postgres-visit-repository.ts` | 85 |
| `platform/http/api-exception.filter.ts` | 73 |
| `modules/field-operations/infrastructure/postgres-command-executor.ts` | 68 |
| `platform/database.ts` | 52 |
| `modules/field-operations/workdays/infrastructure/postgres-workday-repository.ts` | 51 |
| `modules/field-operations/field-operations.factory.ts` | 47 |
| `cli.ts` | 46 |
| `contract.ts` | 46 |
| `modules/field-operations/visits/http/visits.controller.ts` | 46 |
| `modules/identity/application/login.ts` | 42 |
| `modules/field-operations/workdays/http/workdays.controller.ts` | 41 |
| `modules/identity/application/provision.ts` | 41 |
| `modules/identity/application/ports/identity-repository.ts` | 39 |
| `modules/identity/infrastructure/node-credentials.ts` | 39 |

## Tests y verificación de esta inspección

| Archivo desde `tests/` | Declaraciones `test(...)` |
|---|---:|
| `architecture.test.ts` | 1 |
| `config.test.ts` | 2 |
| `foundation.test.ts` | 1 |
| `http.test.ts` | 1 |
| `planning-evidence.test.ts` | 1 |
| `postgres.test.ts` | 1 |
| `security.test.ts` | 3 |

Total: 7 archivos de tests, 10 declaraciones. `tests/support.ts` contiene soporte, sin declaraciones de test.

`foundation` y `security` ejecutan casos de uso a través de factories. `http` y `planning-evidence` levantan Nest y realizan peticiones que atraviesan controllers. No se encontró un archivo unitario dedicado `*.controller.spec.ts`.

`npm test` ejecuta `pnpm run build && node --test --test-concurrency=1 dist/tests/*.test.js`. No se ejecutó durante esta inspección porque compilar escribe archivos. No hay un resultado nuevo de ejecución. El caso de PostgreSQL está marcado para omisión salvo `RUN_POSTGRES_TESTS=1`.

## Alcance del documento

Se inspeccionó código local. Los conteos y ubicaciones describen ese estado; no acreditan resultados de ejecución ni ausencia de defectos. Este documento no incluye código completo, todas las rutas HTTP ni todos los imports. No se modificó código de aplicación para producirlo.
