# Team profile editing and required phone
Scope: local backend and web changes; preserve existing accounts and tenant boundaries.
Verification: focused HTTP regression test and TypeScript; no full application sweep. No commits without user request.

## Specs
- S1: "Que el gerente pueda editar esto, básicamente los datos de la tabla del equipo. Menos el role." Allow only name, email and phone in manager edits; role remains platform-owner controlled.
- S2: "El usuario, el nombre sí, el correo también." Preserve user identity and existing account/email-change safeguards.
- S3: "el número de teléfono sea obligatorio, agregarle un número de teléfono, porque por ese medio se va a hacer match con el TMS" Require an international phone on new user creation, including the initial manager. Existing accounts remain intact with a nullable legacy value until corrected.
- S4: "Cualquiera de los roles tiene que tener número de teléfono y tiene que mostrarse en la tabla también, si es posible." Add phone to platform users and manager team tables/forms.

## Tasks
- T1 [S1-S4] inline: implemented additive nullable phone migration and mandatory creation validation; strict manager-scoped edits, protected/shared identity rejection, audited email change, session/link revocation and pending invitation replacement.
- T2 [S1-S4] inline: implemented shared MemberProfileFields, platform/manager forms and phone columns; manager Edit action preserves role.
- T3 [S1-S4] focused verification: frontend TypeScript and proxy test passed 1/1; backend compile passed; expanded focused HTTP tests passed 2/2 including pending-email replacement. Independent verifier found no blockers. Local migration applied and backend restarted. No live authenticated UI walkthrough. Owner-regression assertion correction not rerun; no full-suite pass claimed.

## Log
- L1 User: "Entonces, lo que está faltando es que el gerente pueda editar, como habíamos hablado ayer, ¿cierto? Que el gerente pueda editar esto, básicamente los datos de la tabla del equipo. Menos el role. El role sí no, porque el role creo que se define ya por mi parte. O no estoy seguro, tal vez sí debería, porque al final el precio va a ser el mismo. Pero por ahora no el role. El usuario, el nombre sí, el correo también. Y no sé si falta algún otro dato que pueda editar. Ah, lo que está faltando es que el número de teléfono sea obligatorio, agregarle un número de teléfono, porque por ese medio se va a hacer match con el TMS, de a quién le vayan a llegar los mensajes. Número de teléfono, que sea obligatorio al momento de registrar. Cualquiera de los roles tiene que tener número de teléfono y tiene que mostrarse en la tabla también, si es posible."
- L2 Route: parent implements inline after bounded read-only mapping; security and additive stored schema change require independent verification. Phone uses international representation; legacy values remain null rather than invented. Existing dirty work is preserved. No TMS messaging implemented.
- L3 Verification encountered sandbox write/spawn restrictions, resolved with authorized local escalation. Expanded test fixture initially mixed checked/unchecked Prisma relations; corrected to company.connect. Existing owner regression assertion incorrectly rejected the public metadata passwordChangedAt; narrowed to actual secret keys. No broad suite executed. No unrelated changes committed.
