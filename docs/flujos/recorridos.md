# Recorridos visibles y reglas

Este documento describe los procesos actuales por actor y canal. Los nombres de controles reflejan las pantallas revisadas; las referencias técnicas están en la [guía para agentes](../agentes.md).

## F01 · Empresas, usuarios y equipo

**Actor:** propietario global en web. **Resultado:** empresa y cuentas habilitadas.

1. Iniciar sesión y abrir **Empresas → Nueva empresa**.
2. Completar nombre y subdominio. La zona horaria muestra Lima y está inhabilitada; el identificador lo genera el backend. El dominio completo utiliza el dominio base configurado.
3. Completar también nombre y correo del gerente inicial. Guardar crea la empresa y ese usuario, y prepara automáticamente su correo de activación. Configurar el dominio no registra DNS ni despliega otra aplicación.
4. Entrar a **Usuarios → Nuevo usuario**. Seleccionar explícitamente la empresa dentro del formulario, nombre completo, correo y rol Comercial, Mercaderista o Gerencia. La contraseña la establece el usuario mediante un enlace de un solo uso.
5. Guardar. La cuenta queda vinculada a la empresa elegida y su correo se prepara automáticamente. El selector de empresa de la página filtra el listado y no decide la empresa del formulario de creación.
6. Consultar y filtrar usuarios; activar o desactivar pertenencias no protegidas mediante el interruptor de estado. Se conserva el historial.

Desde Empresas se puede suspender con confirmación y reactivar una empresa. La suspensión revoca sesiones de empresa, bloquea el acceso y la gestión individual; conserva los estados previos de usuarios y el acceso independiente del propietario global. El formulario lista empresas suspendidas, pero rechaza crear usuarios en ellas.

La tabla Empresas muestra el correo del gerente registrado; si hay varios, utiliza el de la pertenencia de Gerencia más antigua. Si no existe Gerencia, indica que no hay gerente registrado. El nombre completo pertenece a la cuenta de usuario. El dominio sigue almacenado para el acceso, pero no ocupa una columna de la tabla. El interruptor en Acción indica empresa activa en verde o suspendida en gris; su tooltip describe el estado y la acción.

En Usuarios, el icono **Editar usuario** permite al propietario modificar nombre, correo y rol conservando la empresa y los identificadores. Debajo de Rol permanece **Nueva contraseña**, opcional para soporte administrativo: vacía conserva la actual; completada exige de 12 a 128 caracteres, guarda un hash y registra el cambio. No se muestra la contraseña almacenada. Cambiar correo, rol o contraseña revoca las sesiones del usuario; cambiar correo o contraseña invalida los enlaces de acceso anteriores. Para cambiar rol deben resolverse sus asignaciones y operaciones abiertas. Los propietarios globales y los usuarios de empresas suspendidas están protegidos. La acción de recuperación por correo permite que el usuario establezca su propia contraseña sin entregársela al administrador.

**Equipo:** Gerencia consulta los usuarios de su propia empresa, su historial de accesos y una acción contextual: reenviar invitación antes de activarse o enviar recuperación de contraseña después. No crea usuarios ni cambia roles, pertenencias o estados. Ver [activación, recuperación y trazabilidad](accesos.md).

**Impacto de modificar F01:** revisar aislamiento entre empresas, login por dominio, sesión global, revocación, permisos e historial. Usuarios y clientes son entidades distintas.

## F02 · Clientes y responsables

**Actor:** Gerencia con permisos de gestión en web. **Resultado:** cartera y responsables disponibles para planificar.

1. Abrir **Clientes → Cartera**. Buscar por nombre o RUC y utilizar los filtros de cartera.
2. Pulsar **Nuevo cliente**. Completar nombre o razón social, RUC de 11 dígitos, distrito y dirección. Zona y Comercial responsable son opcionales.
3. Guardar. La creación permite asignar Comercial; Mercaderista se asigna después desde **Asignaciones**.
4. En **Asignaciones**, elegir uno o varios clientes y un responsable activo del rol correspondiente dentro de la empresa.
5. Confirmar. Los clientes asignados quedan disponibles para programar visitas al responsable.

La reasignación reemplaza al responsable del rol elegido y conserva la asignación del otro rol. El backend valida empresa, rol y estado. No se encontró endpoint activo para editar clientes: no se documenta edición como funcionalidad conectada.

**Impacto de modificar F02:** revisar cartera visible por responsable y clientes disponibles en programación. El efecto sobre visitas ya programadas necesita comprobarse antes de cambiar reglas; no se supone cancelación ni transferencia automática.

## F03 · Planificación, ejecución y resultados

**Actores:** Gerencia en web; Comercial y Mercaderista en móvil. **Resultado:** visitas cerradas y jornadas consultables.

### Preparar desde web

1. Disponer de empresa habilitada, responsable activo y cliente asignado mediante F01 y F02.
2. Abrir **Visitas y jornadas**, utilizar la vista de equipo y elegir **Agendar visita**.
3. Seleccionar rol, responsable, uno de sus clientes asignados, fecha y hora local de empresa.
4. Guardar. Programar una visita no inicia la jornada. El backend rechaza responsables no disponibles, clientes no asignados, coincidencia de responsable y horario y fechas de jornada ya cerrada.

### Ejecutar desde móvil

1. Iniciar sesión con cuenta Comercial o Mercaderista.
2. En **Jornada**, iniciar jornada. Una jornada activa anterior debe resolverse antes de iniciar otra.
3. En **Agenda**, abrir una visita pendiente. Los datos se consultan al navegar, volver al primer plano o recuperar conexión; no se utiliza sondeo periódico. Se conserva la consulta manual como ayuda ante fallos.
4. Registrar llegada. Requiere jornada activa y visita pendiente; no puede haber otra visita activa del responsable.
5. Completar resultado, observaciones opcionales y requisitos del rol.
6. Cerrar visita y esperar confirmación del servidor. Consultar el registro guardado o volver a Agenda.
7. Completar las visitas correspondientes y cerrar jornada mediante su confirmación.

| Resultado | Comercial | Mercaderista |
|---|---|---|
| Atendida | Registro; fotografía opcional | Auditoría y fotografía obligatorias |
| Local cerrado o no atendida | Resultado sin auditoría de exhibición | Resultado sin exigir ni inventar auditoría |

La auditoría recoge stock en exhibición, motivo si no hay stock, exhibición de marca y precios visibles. La imagen debe ser JPG, PNG o WebP de hasta 1 MiB. El flujo base no requiere pedidos ni firmas.

### Estados y cierre

| Entidad | Estados |
|---|---|
| Visita | `pending` → `active` → `completed`; `pending` puede pasar a `cancelled` antes de iniciar jornada |
| Jornada | `active` → `completed`; la ausencia de registro se presenta como no iniciada |

El cierre exige jornada activa y no tener visitas pendientes o activas programadas en o antes de la **fecha de negocio guardada en esa jornada**. Las visitas canceladas y las posteriores no bloquean ese cierre. Iniciar jornada vincula su planificación y bloquea cambios; el backend rechaza creaciones, reprogramaciones y cancelaciones sobre ese recorrido aunque una pantalla web haya quedado desactualizada. Las reprogramaciones y cancelaciones previas conservan auditoría y versión. El reloj no inicia visitas automáticamente. Los totales se calculan en el servidor, sin depender de las páginas cargadas en el dispositivo.

### Consultar desde web

Gerencia consulta **Agenda**, **Jornadas** y **Registros**, con filtros según la vista. El detalle muestra resultado, horas guardadas, auditoría cuando exista y fotografía autenticada. Cada jornada contabiliza las visitas del responsable correspondiente.

### Fallos y límites

Se requiere conexión. Una operación incierta conserva su cuerpo y clave original para reintentar sin duplicarla; no se acepta trabajo offline. Borradores sin guardar y token nativo permanecen en memoria. La galería y los permisos necesitan verificación real en dispositivo.

Gerencia utiliza web; móvil muestra un aviso para ese perfil. La representación del mapa no demuestra coordenadas, distancias ni validación de perímetro.

**Impacto de modificar F03:** revisar asignaciones, permisos, fechas, transiciones, cierre de jornada, diferencias por rol, evidencias y reintentos. Una confirmación visual debe corresponder a una escritura aceptada por el servidor.
