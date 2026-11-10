# Salinas backend

NestJS REST API with Prisma 7.10.1 and PostgreSQL. The active application uses Prisma model operations and transactions for identity, customers, agenda, workdays, visits, evidence, idempotency and audit records.

## Run

Requires Node 22.12+ (Node 24 is supported), pnpm 12.14.0 and PostgreSQL 17. Run commands from `backend/`; use `npx pnpm` if pnpm is unavailable.

1. Configure private `.env` using `.env.example`; set the actual PostgreSQL URL and explicit tenant hostname mapping.
2. `pnpm install --frozen-lockfile`.
3. `pnpm run build` generates the pinned Prisma client and compiles TypeScript.
4. Apply migrations using the appropriate procedure below.
5. `pnpm start` listens on the configured host/port (local default `127.0.0.1:3002`).

Startup does not migrate, seed, grant capabilities or create users. All operator commands are local tools, not customer self-service APIs. Database credentials must never be exposed to browsers/mobile clients.

## Owner company and user setup

The web start point is **Companies → Users → Create user**. An explicitly authorized global owner creates companies and their users, selects Commercial, Merchandiser or Gerencia (`manager`), and can activate/deactivate non-owner memberships. Clients remain business customers; users are separate login identities. Deactivation removes that membership's sessions and preserves its history. Owner memberships cannot be deactivated through this panel.

Initial owner activation is a local operator action: set `USER_EMAIL` to the existing, explicitly authorized identity and run `node --env-file-if-exists=.env dist/src/cli.js grant-platform-owner`. This changes only its global owner flag; it never changes the password or creates another account. `isPlatformOwner` defaults to false and cannot be supplied through user creation requests. Future user creation occurs through the authenticated owner API, not through this bootstrap command.

| API                                                                   | Behavior                                                                                                                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET/POST /v1/platform/companies`                                     | Owner-only company listing/creation with name, slug, IANA time zone and hostname. Counts include every active role.                                                       |
| `GET/POST /v1/platform/companies/:companyId/members`                  | Owner-only company user listing/creation; strict named identity, email, password and role input. Existing email identities are rejected instead of resetting credentials. |
| `POST /v1/platform/companies/:companyId/members/:membershipId/status` | Owner-only membership activation/deactivation with `{active}`.                                                                                                            |
| `GET /v1/team/members`                                                | Company-scoped read-only team for authorized managers. Query parameters cannot override company scope.                                                                    |

All writes require `Idempotency-Key`. Receipts retain the acting owner's tenant identity; platform audit records link the global actor to the explicit target company. Passwords are absent from responses, audit entries and request fingerprints. A repeated user creation verifies the supplied password against the created user's salted credential hash; different password with the same key is rejected. Invalid/rejected commands roll back all changes.

Gerencia is a web-only membership role, with its company's customer and field-management capabilities. It cannot create users or access owner APIs. Commercial/Merchandiser users retain field defaults. A global owner can manage its current company's operations; both token permissions and fresh transactional predicates recognize the owner flag. Other tenant routes and sessions remain company-bound.

Company hostnames are persisted in `company_domains` and immediately participate in login routing. Explicit environment bootstrap host mappings remain reserved. An unknown hostname is rejected; database lookup failures propagate rather than selecting another company. Saving a hostname configures application routing, not external DNS, certificates or hosting. SMTP password recovery, billing and licensed-seat quotas are not implemented.

## Migrations: existing database

This procedure is for a database already carrying the former `001-foundation.sql` and `002-visit-planning-evidence.sql` migrations. Back up that database first. Confirm both legacy migrations were applied before marking the baseline; do not mark a baseline on an incomplete schema.

```sh
pnpm run migrate:baseline
pnpm run migrate
```

`migrate:baseline` runs the official `prisma migrate resolve --applied 0_initial`. It records the existing schema as applied instead of recreating tables. `migrate` runs official `prisma migrate deploy`, which applies the additive customer/capability/coordination migration. Do not use `migrate reset` or `db push` against existing business data.

`prisma/migrations/0_initial/migration.sql` preserves the original two SQL migrations, including composite tenant foreign keys, state consistency CHECK constraints, active-day/visit partial unique indexes, image constraints and historical records. The old `schema_migrations` table, when present, is left untouched; Prisma uses `_prisma_migrations` for subsequent deployments.

For a new empty database, run only `pnpm run migrate`. Prisma applies the baseline followed by the additive migration. Future schema changes must use reviewed new Prisma migrations; do not edit applied migrations. CHECK constraints remain migration DDL because Prisma schema does not express them.

## Operator commands

| Command                                                                    | Required process environment                                                       | Result                                                                                                     |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `pnpm run provision`                                                       | `COMPANY_SLUG`, `COMPANY_NAME`, `COMPANY_TIME_ZONE`, `USER_EMAIL`, `USER_PASSWORD` | Creates a company and commercial membership; a matching existing identity can join another company.        |
| `node --env-file-if-exists=.env dist/src/cli.js assign-visit`              | `COMPANY_ID`, `MEMBERSHIP_ID`, `SCHEDULED_AT`, `CUSTOMER_NAME`, `CUSTOMER_ADDRESS` | Creates an initial customer, assignment and visit atomically for an active Commercial/Merchandiser target. |
| `node --env-file-if-exists=.env dist/src/cli.js grant-customer-management` | `COMPANY_ID`, `MEMBERSHIP_ID`                                                      | Explicitly enables customer management for one active membership in that company.                          |
| `pnpm run contract`                                                        | Normal runtime configuration                                                       | Generates `contracts/openapi.json` from controller endpoint metadata and associated Zod DTOs.              |

Do not place real passwords in command arguments, committed fixtures or documentation. Password hashes retain the existing salted scrypt format. Session tokens remain opaque and only their SHA-256 digest is stored.

## Active source structure

```text
src/
├── main.ts
├── app.ts
├── app.module.ts
├── cli.ts
├── config/
│   ├── environment.ts
│   └── tenant-domains.ts
├── database/
│   ├── prisma.module.ts
│   └── prisma.service.ts
├── common/
│   ├── decorators/
│   ├── errors/
│   ├── filters/
│   ├── guards/
│   ├── http/
│   └── types/
└── modules/
    ├── identity/             # controllers, services, dto
    ├── customers/            # controllers, services, dto
    ├── field-operations/
    │   ├── services/         # shared atomic command coordination
    │   ├── agenda/           # controllers, services
    │   ├── workdays/         # controllers, services, dto
    │   ├── visits/           # controllers, services, dto
    │   └── management/       # company planning and monitoring
    ├── platform/             # owner company/user commands, access and global audit
    ├── team/                 # company-scoped read-only user listing
    └── system/               # health and controller-derived OpenAPI
```

`src/generated/prisma/` is generated and ignored. Prisma models are not duplicated as domain entities. API DTOs select/map only the response fields required by existing web/mobile contracts. Services raise application errors; one global filter maps them to HTTP. Services do not throw HTTP exception classes.

### Pending legacy cleanup

67 superseded source files remain on disk because automatic approval review rejected their bulk removal, even after a verified backup. They are individually listed in `tsconfig.json` exclusions, are not imported by the active application, and are checked by the architecture test. Their layer/factory/facade/raw-SQL implementations are **unused**, not deleted. A SHA-256-verified source-only archive and exact inventory exist locally under ignored `.test-artifacts/legacy-source/`. Retiring these files still requires explicit approval. This migration must not be described as having a fully cleaned source tree until that cleanup occurs.

## HTTP behavior

Existing `/v1/auth/*` and `/v1/me/*` routes retain their company/member scope. Visit responses add optional nullable `audit`; historical records remain readable. `/v1/me` exposes independently granted `manage_customers` and `manage_field_operations` permissions. The hostname mapping identifies the company, and the session must belong to that company. There is no default company.

| Customer management endpoint     | Behavior                                                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `GET /v1/customers`              | Company portfolio with actual RUC/district/zone and assigned members.                                                          |
| `GET /v1/customers/assignees`    | Active commercial/merchandiser memberships of that company, identified by membership ID and email.                             |
| `POST /v1/customers`             | Strict name/address/RUC/district/optional zone input; optional commercial assignment; duplicate RUC rejected per company.      |
| `POST /v1/customers/assignments` | Atomic assignment for selected customers; replaces that target role while preserving the other role and all historical visits. |

These four endpoints require `manage_customers`; an ordinary commercial or merchandiser does not receive this capability automatically. Creating users and granting platform roles are not customer operations. The personal `GET /v1/me/customers` remains unchanged and returns assigned customers only. Customers do not introduce branches/storefront entities or same-RUC store expansion.

Financial condition and last purchase date have no connected source and are explicitly `null`, not fabricated from visits. Lists remain capped at 200 records; pagination beyond this bound is not implemented.

### Company planning and mobile execution

An operator grants `manage_field_operations` using `COMPANY_ID` and `MEMBERSHIP_ID` with `node --env-file-if-exists=.env dist/src/cli.js grant-field-management`. This capability is independent of customer management; ordinary Commercial and Merchandiser memberships retain only their own `/me/*` scope.

| Endpoint under `/v1/field-operations` | Behavior                                                                                                           |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `GET /members`                        | Active company field memberships, with ID, email and role.                                                         |
| `GET /members/:id/customers`          | Only customers assigned to the selected active company member.                                                     |
| `GET /agenda`                         | Company visits, including member identity, results, nullable audit and evidence availability.                      |
| `GET /workdays`                       | Company workdays, including member identity and role.                                                              |
| `POST /visits`                        | Schedule `{membershipId, customerId, scheduledAt}` for an active assigned field member. Requires an operation key. |
| `GET /visits/:id/evidence`            | Read an existing company visit's image, or JSON null when absent.                                                  |

Agenda/workday queries accept optional `membershipId`, `role` (`commercial` or `merchandiser`) and ISO business `date`. Date filtering uses the company time zone. Their rows add `member_email` and `member_role`. Historical records remain visible even if a field membership is subsequently deactivated. Target selection, assignment and scheduling checks execute within the same Serializable command transaction. Manager and target are coordinated in stable ID order; receipts and audit ownership remain with the acting manager. A successful idempotent replay revalidates access and does not write again.

From mobile, both roles start a workday, check into their assigned visit, close it and end the workday. An attended Merchandiser visit requires an image attachment and `audit: {hasShelfStock, noStockReason?, brandDisplay, pricesVisible}`. The first and last fields are booleans; `brandDisplay` is `adequate` or `inadequate`. A no-stock reason is trimmed text of 1–1000 characters, required only when stock is absent. Commercial and closed/unavailable visits cannot submit exhibition audits. Closed/unavailable outcomes require no fabricated audit or photograph. Visit, audit, photograph, receipt and operation audit persist atomically.

### Operator member provisioning

`provision` still creates a company and its initial membership; optional `USER_ROLE` defaults to `commercial` and accepts `commercial`, `merchandiser` or `manager`. To add a user to an existing company as a local operator, provide `COMPANY_ID`, `USER_EMAIL`, `USER_PASSWORD` and optional `USER_ROLE`, then run `node --env-file-if-exists=.env dist/src/cli.js add-member`. Keep credentials in local process environment, not source or command history. Passwords pass the existing validation and hashing policy. An existing identity must match the provided password; an existing membership is reused only when active and already the requested role. The command never silently resets a password, changes a role or reactivates a membership. Output contains identifiers and role only. Manager creation grants that company's management capabilities; it does not grant global ownership.

Field write commands use `Idempotency-Key`. State, receipt and audit are committed together. ORM updates serialize changes for a membership; Serializable transactions handle conflicts with bounded retries configured by `DB_TRANSACTION_ATTEMPTS`. Exhausted retries produce an explicit `transaction_conflict` response. A rejected operation rolls back all its writes.

Calendar rules remain based on company timezone. An active workday is required for visits; only one active visit is allowed. Due/overdue visits block normal workday closure; future visits do not. Results `attended`, `closed` and `unavailable` describe attendance, not sales/payment/delivery. Optional JPEG/PNG/WebP evidence is limited to 1 MiB and stored atomically; reads require the owning membership. Maps, native GPS, offline acceptance, sales, debt ingestion and Brango integration are outside this implementation.

## Tests

`pnpm test` compiles and runs every test against actual local PostgreSQL, using generated isolated `test_<uuid>` schemas. It requires `TEST_DATABASE_URL` or `.env` `DATABASE_URL`, rejects remote hosts and drops only its own generated schemas. It does not reset or seed the business schema. No PGlite replacement stands in for the production Prisma path.

Coverage includes tenant/session boundaries, revoked/expired sessions, login lockout and hash storage, field transitions, calendar rules, evidence validation/rollback/readback, idempotency, two independent Prisma clients competing for transitions, customer capability/creation/assignment isolation and role preservation. A migration regression seeds the legacy schema and historical data, adopts the Prisma baseline, deploys twice, and checks data/hash/session/evidence/receipt preservation plus database constraints.

The architecture test checks only the active application, explicitly reports the pending legacy exclusions, forbids raw SQL/driver imports there and rejects imports back into excluded legacy files. Device behavior, production deployment/load and backup restoration are not established by this suite.
## Editing platform users

The global owner can edit a company user's display name, email, membership role and optionally password with `POST /v1/platform/companies/:companyId/members/:membershipId/details` and an `Idempotency-Key`. The strict body contains `displayName`, `email`, `role` and optional `password` (12–128 characters); company and identity IDs cannot be changed through this endpoint. Omit `password` to preserve the existing hash. A supplied password is securely hashed, clears login lockout counters and revokes the user's company sessions. Email is normalized to lowercase and remains unique. Passwords and their fast digests are never stored in receipts, audit entries or responses. Retrying a password change verifies the submitted password against the current hash; reusing its key with another password is rejected.

The company must be active and the target cannot be a global owner. Changing roles requires removing customer assignments and resolving pending/active visits and active workdays first. Completed history is retained. Role changes apply the appropriate manager capabilities; email or role changes revoke the user's company sessions. Successful commands are audited and idempotent. Name/email belong to the shared identity; role belongs only to the selected company membership.

