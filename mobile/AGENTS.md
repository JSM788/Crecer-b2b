# Mobile agent entry point

Read `docs/README.md` first, then `docs/module-map.md`. Read only the mapped feature and its flow before changing code. These instructions apply to this mobile package; the root Next.js web app is separate.

## Change rules

- For UI work, read `docs/visual-reference.md` and inspect the approved images before editing. Match their compositions and verify the rendered mobile views; do not introduce an unsolicited redesign.

- Keep source identifiers and technical documents in English. Follow existing Spanish demo UI copy unless requested otherwise.
- Organize by capability. Roles choose permissions and navigation; never duplicate an entire module for a role.
- Centralize fictional records in `src/data/fixtures.ts`, copy in `src/config/copy.ts`, routes in `src/config/routes.ts`, design tokens in `src/shared`, and public runtime settings in `src/config/environment.ts`.
- Centralize by ownership, not into one global file. Do not move business rules into configuration or hide dependencies in generic helpers.
- Screens dispatch domain actions. Keep transition guards in the pure reducer, not only in disabled buttons.
- Do not import root web UI or mutate the root demo store from mobile.
- Never present simulated camera, GPS, sending or authentication as operational integrations.
- Do not add future empty modules or production credentials to fixtures or public environment values.
- Update affected flow/module/decision documents in the same delivery as the implementation.
- For incidents, record symptom, reproduction, owning files, verified cause, fix and regression check in `docs/troubleshooting/README.md`.

## Checks

Run `npm test`, `npm run typecheck`, `npm run export:web` and `npx expo install --check` from `mobile/`. Test changed interactions in the browser. Report unavailable device checks honestly. No automated check proves native GPS or background behavior.
