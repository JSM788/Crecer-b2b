# Mobile architecture

The mobile app is an independent Expo package alongside the Next.js web frontend. Both use the authenticated field API and PostgreSQL records; platform UI remains independent.

## Dependency direction

```text
Expo routes → module screens → FieldProvider → FieldApi → BFF (web) / API (native)
                                  ↓
                         pure transition guards
```

Pure domain guards protect actions before transport; the server remains authoritative. FieldProvider atomically hydrates session, customers, agenda and workday, and disables execution when hydration fails. FieldApi validates responses, tenant/member ownership and evidence size. Theme, copy, routes and public settings retain separate ownership.

## Boundaries and growth

| Concern     | Current implementation                                   | Future replacement                                    |
| ----------- | -------------------------------------------------------- | ----------------------------------------------------- |
| Login       | HttpOnly web cookie / memory-only native bearer          | Native secure storage if separately authorized        |
| Records     | Authenticated API and server history                     | Further modules as approved                           |
| Offline     | Not implemented                                          | SQLite plus durable command outbox and reconciliation |
| Location    | Explicitly illustrative map                              | Device location adapter and permission policy         |
| Photo       | Real library selection and authenticated server evidence | Native device verification                            |
| Permissions | Verified company membership and server authorization     | Additional authorized capabilities                    |
| Navigation  | Five destinations                                        | Add functionality modules as approved                 |

Mutations use one operation key for the exact uncertain command. A confirmed response releases it before refresh. Definitive 4xx failures release it; transport, invalid-response and 5xx uncertainty preserve it. No automatic repeat, offline queue or business-state fallback exists. Drafts are component-local until closure.

## Final capability map (planned)

`auth`, `customers`, `workdays`, `agenda`, `visits`, `audits`, `quotations`, `orders`, `payments`, `requests`, `expenses`, `messaging`, `documents`, `reports`.

The basic five-view flow serves Commercial and Merchandiser through shared visit mechanics. An attended Merchandiser visit includes a typed exhibition audit and photograph in its existing record form; Commercial has no audit action. Audit validation is owned by `modules/visits/domain/exhibition-audit.ts`, and the server saves the audit, image and closure atomically. This small capability remains within the visit module rather than creating an empty standalone module; additional audit workflows can establish a separate module when they exist. See [Merchandiser audit decision](decisions/003-merchandiser-audit.md).

## Configuration ownership

Public environment values configure application identity and native API/tenant selectors, never secrets. Web reads go through the same-origin BFF; the local preview forwards only the fixed API prefix to an explicitly configured loopback origin. Copy owns labels, theme owns appearance, and domain code owns valid behavior.
