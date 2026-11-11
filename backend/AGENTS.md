# Reglas de Proyecto y Guía para Agentes — Backend (Salinas / Aquamundo B2B)

Este archivo define las reglas de arquitectura, seguridad y directrices no negociables para cualquier agente de IA o desarrollador que trabaje en el backend de este monorepositorio.

---

## 1. Fuentes de la Verdad (Leer SIEMPRE antes de crear o modificar)

1. **Requisitos de Negocio y Reglas Core**:
   - `../REQUISITOS.md`: Especificación central (Anti-Mock GPS, geocercas 50m, geolocalización por eventos, conciliación, SAP Business One, SUNAFIL).
   - `README.md`: Configuración de entorno, comandos de operador y arquitectura activa.
2. **Modelo de Datos y Base de Datos**:
   - `prisma/schema.prisma`: Esquema de PostgreSQL 17 con modelos (`Company`, `User`, `Membership`, `Customer`, `Workday`, `Visit`, `VisitEvidence`, `Operation`, `AuditEntry`).
3. **Contratos y DTOs**:
   - `contracts/openapi.json`: Contrato OpenAPI canónico generado desde los controladores.
   - `src/common/types/principal.ts`: Definición de identidad `Principal` (tenant) y `PlatformPrincipal` (owner global).

---

## 2. Arquitectura Backend Obligatoria (`src/`)

El backend es una API REST construida con **NestJS** y **Prisma ORM**, estructurada en módulos de dominio:

* **Estructura por Módulos (`src/modules/`)**:
  * Cada módulo (`platform`, `identity`, `team`, `customers`, `field-operations`, `invitations`) encapsula sus `controllers`, `services` y `dto/`.
  * **Controladores**:
    * Utilizan exclusivamente el decorador `@Endpoint({ method, path, input, output, operationKey })` y `ZodValidationPipe`.
    * Delegan toda la lógica a los servicios; no interactúan directamente con Prisma.
  * **Servicios**:
    * Encapsulan las operaciones de base de datos dentro de transacciones Prisma (`tx: Transaction`).
    * **Prohibido lanzar `HttpException`**: Los servicios deben lanzar errores de dominio usando `reject('codigo')` o `rejectField('codigo', ['campo'])` desde `src/common/errors/application-error.ts`. El filtro global `ApiExceptionFilter` se encarga de mapearlos a HTTP.
  * **DTOs y Esquemas Zod**:
    * Todo request y response se valida mediante esquemas Zod estrictos (`.strict()`).
    * Prohibido devolver campos sensibles (hashes de contraseñas, tokens crudos, secretos).

---

## 3. Seguridad y Multi-Tenancy Estricto (NO NEGOCIABLE)

1. **Aislamiento Multi-Tenant**:
   * Cualquier consulta o mutación dentro del alcance de empresa **debe filtrar obligatoriamente por `principal.companyId`**.
   * Prohibido confiar en `companyId` proveniente del body o query params para operaciones de tenant; siempre se toma del `Principal` verificado por sesión.
   * La cuenta `platform_owner` administra empresas globalmente (`v1/platform/*`) y no debe mezclarse con operaciones cotidianas de campo.
2. **Idempotencia en Escrituras**:
   * Todas las operaciones mutantes (`POST`) requieren la cabecera `Idempotency-Key` y se registran usando `OperationKey` en `operations` o `platform_operations`.
3. **Manejo de Credenciales**:
   * Las contraseñas usan hashing `scrypt` con salt.
   * Los tokens de sesión se almacenan únicamente como digest SHA-256 (`token_hash`).

---

## 4. Base de Datos y Migraciones

1. **Protección de Datos**:
   * **Prohibido** usar `prisma db push` o `prisma migrate reset` en bases de datos con datos reales.
   * Las migraciones deben ejecutarse únicamente con:
     ```powershell
     pnpm run migrate
     ```
2. **Prisma Client**:
   * El cliente de Prisma está configurado en `src/generated/prisma`. Si se modifica `schema.prisma`, regenerar con:
     ```powershell
     pnpm run prisma:generate
     ```

---

## 5. Reglas de Calidad y Verificación (MANDATORIO)

Antes de dar cualquier tarea por completada o entregar una respuesta:

1. **Compilación y Tipos**:
   ```powershell
   pnpm run build
   ```
   Genera Prisma client y compila TypeScript sin errores.
2. **Pruebas de Integración**:
   ```powershell
   pnpm run test
   ```
   Valida que los endpoints mantengan compatibilidad con los contratos BFF y las pruebas existentes.
3. **Sincronización de Contrato OpenAPI**:
   * Si se alteran endpoints o DTOs, actualizar el contrato con:
     ```powershell
     pnpm run contract
     ```

