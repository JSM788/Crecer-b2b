# Aquamundo mobile

Five-screen commercial field demo built with Expo, React Native and TypeScript. Start with [the documentation index](docs/README.md) to locate a feature or diagnose a problem.

## Run locally

Requires Node 22.13+ and npm. This package installs independently from the root Next.js app.

```sh
cd mobile
npm ci
npm run web
```

Use the browser preview or `npm start` for Expo device development. Optional public settings are listed in `.env.example`; Expo reads `.env` automatically. Changes to public settings require restarting Metro. Never place secrets in `EXPO_PUBLIC_*` values.

Demo credentials are displayed on the login screen and defined in `src/data/fixtures.ts`. They are fictional presentation data, not production authentication.

## Verify

```sh
npm test
npm run typecheck
npm run export:web
npx expo install --check
```

The demo runs in memory. Refreshing the app resets it. Logout retains the current scenario until reload; Reset restores the fixtures. Arrival coordinates, photos and timestamps are simulated. There is no backend, tracking, offline persistence, synchronization, production login, SAP or WhatsApp connection.

## Implementation boundaries

- `src/app`: route composition only.
- `src/modules`: screens and business rules grouped by functionality, never by role.
- `src/data`: centralized demo fixtures.
- `src/config`: public environment, routes and UI copy.
- `src/shared`: theme, UI primitives and demo composition.

User-facing Spanish follows the approved reference mockups. Source identifiers and technical documentation are English.
