# Aquamundo mobile

Five commercial field views built with Expo, React Native and TypeScript. Login, workday, agenda and visit records use the shared authenticated API. The approved native screen compositions are preserved. Start with [the documentation index](docs/README.md).

## Run locally

Requires Node 22.13+ and pnpm 12.15.0 (`npx pnpm` works when pnpm is not installed). This package installs independently from the Next.js frontend.

```sh
cd mobile
npx pnpm install --frozen-lockfile
npx pnpm export:web
# Start the configured Next.js BFF at 127.0.0.1:3001 first.
# PowerShell:
$env:FRONTEND_ORIGIN='http://127.0.0.1:3001'
$env:PORT='8081'
npx pnpm preview
```

Open `http://localhost:8081` (or the configured port). The hostname must exist in the backend tenant map. The preview gateway preserves browser Host/Origin and forwards only `/api/field` to the configured loopback BFF; it never accepts an arbitrary proxy destination. It binds to `127.0.0.1` by default. `PORT=8082` is supported. Plain `expo start --web` does not provide this gateway.

Use a provisioned account; credentials are not bundled or prefilled. Web sessions use an HttpOnly BFF cookie and restore through `/me` after reload. Agenda has an explicit **Actualizar datos** control for visits scheduled from the web app. Errors remain visible; no fixture or offline fallback exists.

For native development, set `EXPO_PUBLIC_API_URL` to the API origin, then run `npx pnpm start`. HTTPS is required for releases; development also permits loopback and private LAN HTTP addresses for Expo Go. Sign in with email and password: the backend resolves the company and role after validating credentials. No tenant identifier or invitation is needed after password setup. A provided company web domain still constrains browser sessions. The native bearer token lives only in memory; restarting the app requires login. Server records persist. Public environment changes require restarting Metro.

## Verify

```sh
npx pnpm test
npx pnpm typecheck
npx pnpm export:web
npx pnpm exec expo install --check
```

The server owns timestamps, permissions and execution state. Unsaved result/notes/photo remain local drafts until visit closure; leaving the form discards them. A network failure retains the exact pending command/key for **Reintentar operación pendiente**, while a confirmed response releases that key before refreshing server state. Loading/retry controls never claim offline acceptance.

Photo selection uses Expo ImagePicker with JPEG/PNG/WebP evidence capped at 1 MiB of raw bytes. The selected bytes are sent with closure and fetched from the authenticated record endpoint after reload. Device gallery behavior remains subject to native verification. The map is explicitly illustrative; there is no GPS, geofence, offline queue, SAP or WhatsApp integration.

## Implementation boundaries

- `src/app`: route composition only.
- `src/modules`: screens and pure field transition guards grouped by functionality.
- `src/config`: public environment, routes and UI copy.
- `src/shared`: theme, UI primitives, API transport and authenticated state composition.
- `scripts/preview.cjs`: bounded loopback static SPA server and BFF gateway.

User-facing Spanish follows the approved reference mockups. Source identifiers and technical documentation are English.
