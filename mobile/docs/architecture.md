# Mobile architecture

The mobile app is an independent Expo package alongside the existing Next.js web frontend. Both may eventually share transport contracts, but platform-specific UI remains independent.

## Dependency direction

```text
Expo routes → module screens → shared DemoProvider → pure visit/workday reducer
                                  ↑                         ↑
                         app composition              demo fixtures
```

The reducer owns transition guards. Screen controls reflect those guards but cannot bypass them. The provider composes the fictional scenario and React state. Fixtures contain fictional people, customers, schedule, geographic values and demo timestamps. Theme, copy, route definitions and environment settings have separate owners.

## Boundaries and growth

| Concern     | Current implementation          | Future replacement                                    |
| ----------- | ------------------------------- | ----------------------------------------------------- |
| Login       | Fictional credential comparison | Server session and secure token storage               |
| Records     | In-memory reducer               | Repository port with API/local adapters               |
| Offline     | Not implemented                 | SQLite plus durable command outbox and reconciliation |
| Location    | Labeled static scenario         | Device location adapter and permission policy         |
| Photo       | Labeled simulated attachment    | Camera adapter and durable attachment upload          |
| Permissions | One commercial scenario         | Capability checks, backed by server authorization     |
| Navigation  | Five destinations               | Add functionality modules as approved                 |

The current reducer is explicitly demo composition, not a production backend contract. Before adding real persistence, define record IDs, validation, idempotency, retry semantics and conflict policy. A mock-to-API change requires this work; it is not a one-line switch.

## Final capability map (planned)

`auth`, `customers`, `workdays`, `agenda`, `visits`, `audits`, `quotations`, `orders`, `payments`, `requests`, `expenses`, `messaging`, `documents`, `reports`.

Only the basic five-view flow is created now. Commercial and merchandiser access may use shared visit mechanics while having different forms and actions. Exhibition audits belong to `audits`; they do not become a commercial task because the merchandiser role is deferred.

## Configuration ownership

Public environment values configure deployment identity. Fixtures configure the demonstration scenario. Copy configures labels. Theme configures appearance. Domain code defines valid behavior. Avoid environment flags for every UI choice and avoid giant files combining unrelated concerns.
