# Activación, recuperación y trazabilidad

Este recorrido complementa F01. Comercial y Mercaderista operan en móvil; Gerencia utiliza web. Las cuentas se crean desde web por el propietario de la plataforma.

El acceso web usa una lista explícita: propietario global y Gerencia. Los demás roles quedan denegados, incluidos Comercial y Mercaderista. Finanzas y Operador no se habilitan hasta definir e implementar esos perfiles. El backend rechaza el login web de roles no autorizados y el proxy elimina las cookies de acceso anteriores que ya no correspondan. Esto no revoca el acceso móvil de las cuentas de campo.

## Primera activación

1. El propietario crea el usuario indicando empresa, nombre, correo y rol. La creación de empresa incluye su primer gerente.
2. Se guarda la cuenta sin contraseña y se prepara automáticamente un correo. La cola SMTP conserva los intentos y reintenta fallos de forma limitada.
3. El usuario abre el enlace y establece una contraseña de 12 a 128 caracteres.
4. El backend consume el enlace y registra la activación y el cambio de contraseña. No inicia sesión automáticamente.
5. El usuario ingresa con correo y contraseña. La app móvil recibe su empresa, rol y permisos desde la sesión: no requiere configurar empresa ni volver a abrir la invitación.

Mientras no exista contraseña, la cuenta no puede autenticarse. El estado administrativo activo/inactivo y el hecho de haber completado la activación son independientes.

## Recuperación posterior

En Usuarios y Equipo se presenta una sola acción de correo por fila. Antes de activar se llama **Reenviar invitación**; después, **Enviar enlace de recuperación**. Gerencia solo puede solicitarla para usuarios habilitados de su propia empresa; no conoce ni establece sus contraseñas.

La acción solicita confirmación antes de enviar. Cancelar no realiza ninguna solicitud de correo.

La recuperación crea otro enlace de un solo uso. Al utilizarlo cambia la contraseña, se revocan las sesiones y se conserva la fecha original de activación. Solicitar el enlace no cambia la contraseña ni desactiva la cuenta. Los enlaces anteriores no deben permitir recuperar acceso después de completar un cambio posterior.

La vigencia depende de `INVITATION_TTL_HOURS`, configurada localmente en 48 horas. Cada enlace guarda su vencimiento exacto; un reenvío no reescribe el historial del anterior.

## Evidencia disponible

El historial visible muestra correos enviados o fallidos, activación, cambios de contraseña, cambios de cuenta, accesos y rechazos relevantes. Un envío se presenta en una sola fila, conservando el vencimiento del enlace. La auditoría interna conserva además emisión/reemisión, consultas del enlace e intentos técnicos de envío; simplificar la pantalla no elimina esos registros. Las fechas se guardan en el servidor y se presentan con la zona horaria de la empresa.

**Enviado** significa aceptado por SMTP, no recibido o leído por una persona. Una consulta al enlace puede provenir de un filtro de seguridad del correo: no demuestra por sí sola que el usuario lo abrió. Activación y cambio completado requieren una escritura aceptada por el backend.

No se muestran contraseñas, hashes ni tokens utilizables. La trazabilidad histórica no depende del correo actual: las relaciones conservan identificadores estables. Las cuentas antiguas sin evidencia de activación muestran fecha desconocida; no se inventa una fecha retrospectiva.

## Aislamiento y límites

Gerencia puede editar nombre, correo y teléfono desde **Equipo → Editar usuario**, solo dentro de su empresa. No puede cambiar rol, empresa, estado ni contraseña. El propietario de la plataforma conserva esas funciones. Si una identidad tiene pertenencias en otras empresas, su edición queda reservada al propietario para no afectar datos ajenos.

El teléfono es obligatorio en las nuevas cuentas, incluido el gerente inicial, y se guarda con código de país (por ejemplo `+51999111222`). Los registros anteriores conservan un valor vacío hasta completarlo; no se inventan números. El teléfono es un dato de contacto para una futura integración, no reemplaza el ID de usuario ni identifica pedidos por sí solo.

Cambiar el correo conserva el ID y los registros del usuario, cierra sus sesiones e invalida enlaces anteriores. En una cuenta pendiente de activación y habilitada, la edición desde Equipo genera una nueva invitación para el correo corregido. Los cambios quedan auditados.

El backend autoriza cada consulta y escritura. Una sesión de empresa no puede acceder a otra empresa ni tomar el rol enviado por el cliente. Un dominio web de empresa, si se proporciona, restringe el acceso a esa empresa. Una identidad con varias pertenencias activas no obtiene una empresa elegida arbitrariamente: debe utilizar el acceso web de la empresa correspondiente.

Una empresa suspendida o un usuario deshabilitado no puede completar el acceso ni utilizar enlaces para eludir el bloqueo. El propietario global mantiene su ámbito de plataforma separado.

Para pruebas locales SMTP se utiliza Mailpit en `http://localhost:8025`. No acredita entrega real a Gmail u otros proveedores. La apertura de enlaces nativos y el recorrido visual en un dispositivo requieren comprobación en ese dispositivo.
