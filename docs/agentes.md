# Entrada para agentes

Identificar el proceso en [el mapa](mapa-producto.md), leer su [recorrido](flujos/recorridos.md) y seguir las referencias a la implementación. Esta guía orienta la investigación; contrastar sus afirmaciones con el código activo antes de cambiar comportamiento.

## Localizar por tarea o síntoma

| Área | Fuentes principales |
|---|---|
| F01 · Empresas y usuarios | `frontend/src/modules/platform/CompanyForm.tsx`, `MemberForm.tsx`, `MembersView.tsx`, `CompaniesView.tsx`; `backend/src/modules/platform/controllers/platform.controller.ts`, `services/platform.service.ts` |
| F01 · Sesiones y roles | `backend/src/modules/identity/services/auth.service.ts`; `frontend/src/shared/api/contracts.ts`, `platform.ts` |
| F01 · Activación, recuperación e historial | [Recorrido](flujos/accesos.md); `backend/src/modules/invitations/`, `modules/mail/`, `modules/identity/services/access-events.ts`; `mobile/src/modules/auth/InvitationScreen.tsx` |
| Equipo | `frontend/src/modules/team/TeamView.tsx`; `backend/src/modules/team/` |
| F02 · Clientes y asignaciones | `frontend/src/modules/comercial/clientes/connected/CustomersWorkspace.tsx`, `CustomerForms.tsx`; `backend/src/modules/customers/controllers/customers.controller.ts`, `services/customers.service.ts` |
| F03 · Planificación y resultados web | `frontend/src/modules/comercial/visitas-jornadas/connected/ConnectedFieldView.tsx`, `ScheduleVisitDrawer.tsx`; `backend/src/modules/field-operations/management/services/field-management.service.ts` |
| F03 · Visitas y jornadas backend | `backend/src/modules/field-operations/visits/services/visits.service.ts`, `workdays/services/workdays.service.ts` |
| F03 · Ejecución móvil | `mobile/src/modules/workdays/WorkdayScreen.tsx`, `mobile/src/modules/agenda/AgendaScreen.tsx`, `mobile/src/modules/visits/presentation/VisitScreens.tsx`, `mobile/src/shared/FieldProvider.tsx` |

Si un responsable no aparece, revisar empresa, pertenencia activa y rol antes del selector. Si un cliente no aparece al agendar, comprobar su asignación al responsable elegido. Para cierre de jornada, verificar estado y fecha de negocio almacenada. Para errores de contrato, comparar DTO activo, contrato frontend, proxy y versión realmente ejecutada.

## Fuentes de estructura y contratos

- `backend/src/app.module.ts`: módulos conectados. Hay carpetas heredadas; no asumir que todo archivo encontrado está activo.
- `backend/prisma/schema.prisma`: modelos y relaciones. Los servicios y migraciones completan las reglas y su evolución.
- `backend/contracts/openapi.json`: contrato guardado; contrastar con controllers y DTO activos.
- `frontend/src/shared/api/proxy.ts`: rutas admitidas entre frontend y backend.
- [Documentación móvil](../mobile/docs/README.md) y [flujo móvil detallado](../mobile/docs/flows/basic-visits.md).

## Antes de modificar

Identificar actor, empresa, canal, estado y datos afectados. Seguir pantalla → contrato → servicio activo → modelo y consumidores. Comprobar el cambio de forma proporcional y actualizar solo el recorrido y referencias afectados. La documentación no garantiza por sí sola que no existan dependencias adicionales.

## Incidencias y capturas futuras

Registrar incidencias reales con síntoma, rol/canal, pasos, resultado esperado y observado, causa confirmada o pendiente, solución y comprobación. No inventar problemas para completar el manual.

Cada captura deberá pertenecer a un paso, indicar canal y fecha y evitar secretos o datos reales. Este directorio todavía no contiene capturas operativas verificadas; la imagen del visor es una propuesta de diseño.
