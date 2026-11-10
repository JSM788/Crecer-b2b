# Structured errors from backend to visible web forms
Scope: additive field-error contract, shared web form adapter and visible forms; no new business rules or data migrations.
Verification: focused error serialization/transport/adapter tests and TypeScript; no broad application suite. Preserve inherited work; no commits without user request.

## Specs
- S1: "el fluj ode errores esta bien estructurado desde el backend hasta el front ? de tal forma que se envien errores coherentes y no estar siempre teniendo que ver formulario por formulario ?" Backend emits explicit stable codes and paths; proxy/client preserve them.
- S2: "en el front hay un hook o algo asi que centraliza errores" One reusable hook handles client validation and structured server errors; forms bind their fields without interpreting message text or repeating business-code maps.
- S3: "los mensajes debajo de cada input" Visible forms show field validation inline. General errors remain visible; references stay internal. Confirmations use existing Sonner behavior.
- S4: "asumo tmb ya se agregaron validaciones a todos los formularios que tenemos y el back tmb hace su trabajo" Integrate the currently visible web forms and retain server-side authoritative validation, permissions and safe failure behavior. Hidden mockup forms are outside scope.
- S5: "hazlo" Implementation authorized after read-only Brango comparison. Keep current libraries and manual subdomain.

## Tasks
- T1 [S1,S4] delegated backend_error_fields: complete; additive ApplicationError details, exact domain paths and safe uniqueness mapping. Backend compile passed; focused error-fields tests 8/8 passed.
- T2 [S1,S2] inline shared transport contract, safe messages, pure adapter and useFormErrors hook: complete. Reproduced details stripping before fix; transport/adapter regression tests 6/6 passed after fix. Removed obsolete manual mapping helpers.
- T3 [S2-S4] delegated visible_form_error_hook: complete. Companies, platform members, team profile, customer creation/assignment, schedule/reschedule, login and invitation now use one hook. Frontend TypeScript passed.
- T4 [S1-S4] focused integration verification and independent review: complete with limits. Independent read-only verifier found no concrete blockers; no browser walkthrough or broad suite. Native review unavailable: read-only preflight failed safely with access denied before mutation.

## Log
- L1 Latest user authorization: "hazlo". Prior requested uniform end-to-end error handling; do not infer a field from message text or duplicate rules per form. User explicitly kept current subdomain behavior.
- L2 Two independent writer surfaces launched together: backend DTO/error production and frontend form integration; parent owns shared transport/hook contract. No installs, no data migration, no broad test sweep, no hidden legacy mockup changes.
- L3 Contract retains code/message/requestId and optional details[{path,code?,message}]. Proxy and ApiError preserve all field details, including validation produced by proxy. Hook maps only registered fields and explicit aliases, supports multiple errors, never guesses from message text, and retains visible fallback for unknown paths. Technical references remain internal. Backend validations/permissions remain authoritative; no uniqueness policies added.
- L4 Verification: backend tsc pass; frontend tsc pass; 8 DB-free backend tests and 6 frontend adapter/transport tests passed. First frontend regression reproduced missing details (RED). Independent review passed within structural scope; UI navigation not executed. Native preflight failure was access denied, mutation_outcome not_started; no review receipt or native approval claimed. Runtime backend restart applies compiled changes.
