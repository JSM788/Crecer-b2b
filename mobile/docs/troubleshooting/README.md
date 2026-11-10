# Mobile troubleshooting

| Symptom                                | First check                                    | Verification                                                                    |
| -------------------------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------- |
| Wrong customer or schedule             | Authenticated `/me/customers` and `/me/agenda` | Use **Actualizar datos**, verify web planning                                   |
| Button cannot advance                  | Domain guards + current workday/visit state    | Reproduce from a reset scenario; run tests                                      |
| Correct state, wrong destination       | Route config and `src/app`                     | Navigate from Agenda and browser Back                                           |
| Wrong label or untranslated error      | `src/config/copy.ts`                           | Trigger the relevant error                                                      |
| Branding env change ignored            | Restart Metro; check `EXPO_PUBLIC_*`           | Reload fresh bundle                                                             |
| Web cannot resolve native dependency   | Run package-local install/check                | `npx pnpm install --frozen-lockfile`, then `npx pnpm exec expo install --check` |
| Root web sees native TypeScript errors | Root `tsconfig.json` excludes mobile           | Run the root web build                                                          |
| Data disappears after refresh          | BFF cookie, tenant map and API hydration       | Inspect the explicit API error; never reset server records                      |

## 2026-10-24: Disconnected mobile field state

- Symptom: visits scheduled or executed through the web did not appear on mobile, and mobile completion vanished after reload.
- Reproduction: schedule a real assigned customer, open the former mobile demo, then reload its saved visit.
- Owning files: `src/shared/FieldProvider.tsx`, `src/shared/api.ts`, field screens and `scripts/preview.cjs`.
- Verified cause: the previous provider used an in-memory reducer and fictional credentials/customer/timestamp fixtures without any server transport.
- Fix: hydrate verified API state, send guarded commands with retained keys for uncertain retries, use HttpOnly web sessions and real bounded image evidence. Keep maps explicitly illustrative.
- Regression: mobile API/guard/gateway tests, TypeScript, Expo web export and SDK compatibility checks. Full web→mobile→web browser verification is recorded by the feature coordinator; native device/gallery checks remain separate.

## 2026-10-24: pnpm compiler lifecycle

- Symptom: Expo installed the SDK-compatible image picker but pnpm 12 exited with `ERR_PNPM_IGNORED_BUILDS` for the existing esbuild compiler.
- Cause: pnpm requires an explicit lifecycle-script allowlist; the package previously had only an npm lockfile.
- Fix: use a package-local pnpm lockfile/workspace and allow only `esbuild` in `allowBuilds`. No global tool installation or unrestricted lifecycle permission is needed.
- Regression: `npx pnpm install --frozen-lockfile`, `npx pnpm test` and `npx pnpm export:web`.

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

## 2026-10-25: Real transport and workday rollover

- Symptoms: browser login failed before a network request; yesterday's completed workday prevented starting today; web progress omitted overdue visits executed today.
- Causes: storing browser-native fetch as an object method changed its receiver; latest workday hydration ignored the company business date; the web counted scheduled-date rows instead of actual workday membership.
- Fixes: `src/shared/api.ts` wraps `globalThis.fetch` and normalizes only historical completed days. Active historical days remain available for closure. The web planning adapter groups execution by `workday_id` while keeping agenda scheduling dates separate.
- Regression: mobile12/12 and web7/7 tests passed; independent targeted recheck passed8mobile/1web. Actual web programming → mobile execution with image → web records and PostgreSQL byte-equivalent evidence passed. A wrongly named PNG containing JPEG bytes was correctly rejected; correcting only its file extension allowed the test to complete.
- Limits: physical native gallery and GPS are not proven by browser checks. The map remains explicitly illustrative.
