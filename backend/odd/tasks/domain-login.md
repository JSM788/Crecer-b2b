# Resolve company from the login domain
Objective: credentials-only login with explicit domain routing and company-bound sessions.
Route: inline implementation, independent security verification; pnpm tests. No commits while the user's frontend relocation and existing staged backend remain unresolved.

## Specs
- S1: "todo en minuscula tanto el correo como la contraseaña" — local identity uses the requested lowercase credentials stored in the ignored fixture; retain role and field history.
- S2: "La empresa no se debería colocar" — remove company input; backend resolves an explicitly configured hostname, rejects unknown hosts, and binds protected HTTP requests to that company.
- S3: "se crea un dominio distinto para cada empresa" — configuration supports multiple domains without company-specific source constants. Localhost is an explicit local mapping, not a fallback.

## Tasks
- T1 [S2,S3] inline: domain routing, credentials-only web/API contracts, regression checks; verified, backend8/8 plus explicit PostgreSQL1/1 and frontend4/4 pass; production build passed.
- T2 [S1] inline: update only the existing local fixture account, preserve history, restart and verify; verified, current API and production web restarted, real BFF login/session/agenda/logout succeeded; history preserved.
- T3 [S1-S3] independent verifier: verified, no reproducible blockers; independent compiled HTTP test1/1 passed in isolated PGlite. Production DNS/TLS/proxy deployment remains unverified.

## Log
- L1: User: "todo bien pero todo en minuscula tanto el correo como la contraseaña y lalogica de la deteccion de empresa asumotmb ya esta no ?"
- L2: Existing code requires company slug in login; domain detection is absent. Chosen boundary: backend configured hostname-to-slug map; BFF supplies request URL hostname, never a browser-provided tenant header. Protected HTTP requests additionally constrain session by resolved company.
- L3: Tests: backend pnpm test and explicit local PostgreSQL suite; frontend pnpm test:api, typecheck/build, actual local BFF login and restored session. Risk: authentication, public API contract, and authorized local credential update.
- L4: Observed frontend RED before implementation: credentials-only login400 instead of200, tenant header absent; GREEN4/4. Backend8 passed with real PG check explicitly skipped by default; separate enabled PG check1/1 passed. Existing browser-completed workday/visit and exact observations remain intact after identity update. Independent verifier launched.
- L5: Final production build passed. Current backend exec46295 and frontend exec16402 are serving ports3002/3001. Real HTTP BFF check passed credentials-only login, intended commercial membership, existing agenda, unknown-host400, injected-company400, wrong-password401 and logout. Browser tab2 visibly confirms only email/password fields. Initial probe needed canonical trailing slashes; server HTML initially contains auth-loading state, so form fields were checked in the hydrated browser instead. Independent reviewer found no blockers and ran HTTP contract test1/1. No source baseline commit comparison or native approval claimed.
- L6: Risk: items1,2,3 — authorized local identity update, authentication/domain session isolation and updated HTTP contract. No database migration, business data reset, remote deployment or mobile integration.
- L7: Supplemental native review was not started: assessment is high/unassessable because the pending repository relocation leaves frontend and modular backend files untracked. Canonical status requests an explicit untracked candidate selection; no review authority, approval, commit or stage change was created. Functional checks and independent verification above passed; native review remains pending until a coherent Git candidate exists. Current browser inspection confirms the credentials-only login form.
