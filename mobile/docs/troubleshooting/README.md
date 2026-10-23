# Mobile troubleshooting

| Symptom                                | First check                                 | Verification                               |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------ |
| Wrong customer or schedule             | `src/data/fixtures.ts`                      | Reset the demo and reopen Agenda           |
| Button cannot advance                  | Domain guards + current workday/visit state | Reproduce from a reset scenario; run tests |
| Correct state, wrong destination       | Route config and `src/app`                  | Navigate from Agenda and browser Back      |
| Wrong label or untranslated error      | `src/config/copy.ts`                        | Trigger the relevant error                 |
| Branding env change ignored            | Restart Metro; check `EXPO_PUBLIC_*`        | Reload fresh bundle                        |
| Web cannot resolve native dependency   | Run package-local install/check             | `npm ci` then `npx expo install --check`   |
| Root web sees native TypeScript errors | Root `tsconfig.json` excludes mobile        | Run the root web build                     |
| Data disappears after refresh          | Expected in-memory demo behavior            | Do not diagnose as offline sync failure    |

## Incident record template

## 2026-10-23: SDK and compiler alignment

- Symptom: Expo compatibility check rejected initial TypeScript/React type versions; TypeScript 6 rejected deprecated `baseUrl` and could not resolve Node test types.
- Cause: compiler/type versions were initially selected before querying the installed Expo compatibility map.
- Fix: use SDK-recommended TypeScript and React types, explicit Node test types, and relative `paths` without `baseUrl` in `tsconfig.json`.
- Regression: `npm run typecheck` and `npx expo install --check`.

## Dependency audit follow-up

## 2026-10-23: Expo dynamic configuration import

- Symptom: a fresh Expo command failed with `Cannot find module './src/config/environment'`.
- Cause: the dynamic app configuration is transpiled independently and cannot require an extensionless TypeScript runtime module through Node's default resolver.
- Fix: app configuration and runtime environment read the same portable `src/config/defaults.json`; each keeps its explicit public environment reads.
- Regression: `npx expo install --check` succeeded after the correction; verify a fresh web export before delivery.

## 2026-10-23: Approved mockup fidelity

- Symptom: functional screens used an unsolicited teal palette, different logo and different composition.
- Cause: implementation guidance invited a redesign and verification checked navigation rather than comparing approved reference images.
- Correction: use `docs/visual-reference.md` as the visual acceptance contract; inspect all reference sheets before changes and compare actual rendered phone-sized screens afterward.
- Regression: compare Login, Workday, Agenda, Visit detail, editable/saved Visit record and workday closure against the three approved sheets.

The installation audit on 2026-10-23 reported 19 high-severity entries in the Expo/Metro dependency tree, including transitive `braces` and `node-forge` advisories. `npm audit` suggests incompatible major downgrades for several aggregate entries. No forced downgrade or unverified override was applied. Reassess supported upstream fixes before production deployment; this package is a local visual demo. This is an open dependency limitation, not a clean audit.

For each resolved non-obvious incident add a dated entry containing: symptom; exact reproduction; owning files; verified cause; correction; regression command/result; remaining limitation. Do not record credentials, tokens or personal production data.
