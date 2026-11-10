# Correct the backend architecture
Objective: replace the concentrated implementation with the agreed modular architecture while preserving the existing REST contract and PostgreSQL data. No expansion into unimplemented business workflows.
Runner: pnpm test; pnpm run test:postgres with explicit local DB; frontend pnpm test:api and typecheck after contract correction. User relocation and dirty index preserved; no unrelated staging, commits, publication or global review-mode changes.

## Specs
- S1: "Te dije implementa algo grande." Implement real boundaries for the existing capabilities, not empty future modules or renamed monolith files.
- S2: "Me diste una estructura bien planteada y después me vienes a hacer tres archivos y meter todo ahí." Nest modules/controllers/DTOs, application use cases and ports, pure domain rules and PostgreSQL repositories must have separate owners. Root composition must contain wiring only.
- S3: "usa las mejores practicas,, nada harcodeado, evitar fallback que enmascaran errores". Keep validated config, typed errors, safe logs, hashed credentials, tenancy, transactions, audit and idempotency. No hidden successful fallback or demo data in runtime.
- S4: Preserve initial flow: authenticated company membership, own customers/agenda, start day, check-in, attendance-based visit close and day close. Correct empty no-workday HTTP response to contract JSON null. Preserve tenant foreign keys and actual persisted data.

## Tasks
- T1 [S1-S4] delegated writer, implemented and verified: identity domain/use cases/repositories. Disjoint parallel unit justified by independent behavior and meaningful scope.
- T2 [S1-S4] delegated writer, implemented and verified: customer/agenda/workday/visit domains/use cases/repositories; disjoint from T1.
- T3 [S1-S4] inline, implemented and verified: shared errors, Nest transport/modules/composition, CLI and test callers; obsolete monolith implementations removed.
- T4 [S1-S4] independent verification passed: seven embedded/HTTP checks, real PostgreSQL check and baseline credential/receipt compatibility probe. No unrelated frontend redesign or mobile writes. No commit made while user repository relocation/index remains unresolved.

## Log
- L1 User: "Yo nunca te dije implementa algo mínimo. Te dije implementa algo grande." User rejects unauthorized reduction in architecture. Correct implemented scope's actual structure; do not claim tests alone make it enterprise-ready.
- L2 Baseline contains app.ts with controllers/guard/filter/inline AppModule and two combined module files. Known missing-null JSON regression is already captured in tests. Existing frontend integration is paused/incomplete and user moved project into three sibling folders.
- L3 User: "continua pero si crees qe vas a usar muchos tokens me avisas". Warned that structural correction is substantial. Previous workers hit quota without writes; resumed with bounded disjoint identity/field writers. Both completed with build pass and scoped smoke proof. Parent owns shared HTTP transport, actual Nest modules and composition.
- L4 Old monolith files removed after references migrated. Baseline HTTP regression reproduced empty JSON body; WorkdaysController now serializes missing day as JSON null. Latest suite: seven passed, one explicitly skipped real-DB test. Real-DB rerun initially failed ECONNREFUSED because local PostgreSQL is stopped; restart only the project's known container before repeating.
- L5 Docker Desktop and dedicated salinas-backend-dev container restarted; real PostgreSQL test then passed1/1. Independent fresh-scratch verifier passed S1-S4, seven tests plus the enabled real-PG test, and confirmed old credential and old fingerprint/JSONB receipt compatibility with immutable baseline tree6c6b531243bf433031fe076ee68b6a2ea17ad598. No schema or storage-format changes. Frontend proxy2/2, strict typecheck and production build passed. API running3002, web production check3001.
- L6 Production-browser integration passed: login, assigned customer list, first-day null state, start workday, early day close rejected, check-in, attended outcome/notes, visit close, day close, reload and logout. Independent SQL query verified the exact saved observations and completed states. Screenshot in ignored frontend/.integration/flow-proof.png. No mobile changes.
- L7 Scoped independent frontend review found one retry-key lifetime blocker after confirmed-write/read-refresh failure; corrected with tested request lifecycle helper and targeted reviewer recheck. Four frontend API/retry tests pass. This is a client correction only, with no schema/contract or module behavior changes.
