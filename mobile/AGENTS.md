# Reglas de Proyecto y Guía para Agentes — Mobile (Aquamundo B2B)

Este archivo define las reglas de navegación, arquitectura y restricciones no negociables para cualquier agente de IA o desarrollador que trabaje en la aplicación móvil de campo (Expo / React Native).

---

## 1. Fuentes de la Verdad (Leer SIEMPRE antes de modificar o crear)

Para evitar alucinaciones o código basado en suposiciones, consulta **siempre** los archivos fuente:

1. **Requisitos de Negocio de Campo**:
   - `../REQUISITOS.md`: Especificación central obligatoria (Anti-Mock GPS, geocercas de 50 metros para Check-in, geolocalización por eventos, semáforo de stock en 4 pasos, fotos POP con marca de agua, desconexión digital 19:00).
   - `docs/README.md` y `docs/visual-reference.md`: Mapeo de vistas, composiciones nativas aprobadas y flujos.
2. **Contratos de la API (Backend y BFF)**:
   - `../backend/contracts/openapi.json`: Contrato canónico de endpoints (`/v1/field-operations/*`).
   - `src/shared/api/`: Clientes y contratos de transporte móvil.
3. **Modelos de Datos de Campo**:
   - `../backend/prisma/schema.prisma`: Entidades reales (`Workday`, `Visit`, `VisitEvidence`, `Customer`).

---

## 2. Arquitectura Mobile Obligatoria (`src/`)

La aplicación móvil está construida con **Expo (v58)**, **Expo Router** y **React Native**:

* **`src/app/` (Expo Router)**:
  * **Única responsabilidad**: Enrutamiento y composición de pantallas.
  * **Prohibido**: Concentrar lógica de negocio o estado pesado directamente en los archivos de ruta.
* **`src/modules/` (Lógica de Campo y Pantallas)**:
  * Agrupado por funcionalidad (Jornadas, Agenda, Visita Activa, Ventas/Pedidos, Rendición de Gastos).
  * **Guardas de transición puras**: La lógica de negocio y las transiciones de estado deben residir en reducers/servicios puros, no únicamente en botones deshabilitados en la UI.
* **`src/shared/`**:
  * Primitivas visuales neutras, tokens de diseño, utilidades de fecha/moneda y capa de transporte API.
* **`src/config/`**:
  * Rutas (`routes.ts`), textos en español (`copy.ts`) y variables de entorno (`environment.ts`).

---

## 3. Reglas Críticas de Negocio de Campo (NO NEGOCIABLE)

1. **Geolocalización por Eventos (Cero Tracking Continuo)**:
   * Solo capturar coordenadas GPS al Iniciar Jornada, Check-in, Check-out y Finalizar Jornada.
   * Prohibido implementar rastreo en segundo plano "segundo a segundo" (respeto a la privacidad y compliance laboral SUNAFIL).
2. **Geocerca de 50 Metros**:
   * El Check-in y Check-out solo se habilita si el dispositivo se encuentra a un máximo de 50 metros del perímetro del cliente.
3. **Auditoría POP y Fotografías**:
   * Las fotos de auditoría/exhibición deben tomarse con la cámara e incluir marca de agua inalterable (Fecha, Hora, Coordenadas GPS).
   * La subida de imágenes desde galería está **prohibida** para auditorías de góndola (solo se permite galería para comprobantes/vouchers de pago).
4. **Semáforo de Stock y Pedidos**:
   * Fila Verde: Stock completo facturable hoy.
   * Fila Naranja: Stock parcial (disponible hoy + saldo en backorder).
   * Fila Roja: Sin stock (demanda insatisfecha; no se suma al total a cobrar).

---

## 4. Roles y Seguridad en Mobile

* **Roles soportados**: `commercial` (Vendedor / Preventista) y `merchandiser` (Mercaderista).
* **Sesión**:
  * En web preview: Cookie HttpOnly vía gateway BFF.
  * En dispositivo nativo: Token en memoria vía `EXPO_PUBLIC_API_URL` (nunca hardcodear credenciales ni tokens en storage permanente inseguro).
* Prohibido mutar el store del frontend web o importar componentes visuales de `frontend/`.

---

## 5. Reglas de Calidad y Verificación (MANDATORIO)

Antes de dar cualquier tarea por completada o entregar una respuesta:

1. **TypeScript Estricto**:
   ```powershell
   pnpm run typecheck
   ```
   No se permiten errores de compilación ni tipos `any`.
2. **Pruebas Automatizadas**:
   ```powershell
   pnpm run test
   ```
3. **Export Web y Dependencias**:
   ```powershell
   pnpm run export:web
   pnpm exec expo install --check
   ```
4. **Fidelidad Visual y Lenguaje**:
   * Código, nombres de variables y commits en **inglés**.
   * Textos visibles de la UI en **español** siguiendo los mockups aprobados.
