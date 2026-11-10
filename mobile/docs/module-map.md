# Module and incident map

| Symptom or responsibility                               | Owning path                                                                                                |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Route registration or initial redirect                  | `src/app/`                                                                                                 |
| Login view                                              | `src/modules/auth/`                                                                                        |
| Workday view, start/end confirmation                    | `src/modules/workdays/`                                                                                    |
| Agenda and visit cards                                  | `src/modules/agenda/`                                                                                      |
| Visit detail and editable/saved record                  | `src/modules/visits/presentation/`                                                                         |
| Invalid transition or wrong progress                    | `src/modules/visits/domain/field.ts`                                                                       |
| Merchandiser audit fields, validation and saved answers | `src/modules/visits/domain/exhibition-audit.ts`, `src/modules/visits/presentation/ExhibitionAuditForm.tsx` |
| Server session, customers, schedule, reads/writes       | `src/shared/api.ts`, `src/shared/FieldProvider.tsx`                                                        |
| Web preview gateway and static routing                  | `scripts/preview.cjs`                                                                                      |
| Navigation paths                                        | `src/config/routes.ts`                                                                                     |
| Visible wording and error translation                   | `src/config/copy.ts`                                                                                       |
| Environment and app identity                            | `src/config/environment.ts`, `app.config.ts`, `.env.example`                                               |
| Shared layout, controls, API state, theme               | `src/shared/`                                                                                              |
| Domain regression checks                                | `tests/`                                                                                                   |

The five views are Login, Workday, Agenda, Visit detail and Visit record. Start/end, editable/saved and confirmation dialogs are states of those views, not independent screens.

When adding a module, add an ownership entry here and a short local README if its responsibilities cannot be expressed in this table. Do not create folders solely to mirror a diagram.
