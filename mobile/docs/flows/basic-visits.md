# Basic field visit flow

## Happy path

1. Open Login and use a provisioned company account. Web reload restores the HttpOnly session; native process restart requires login.
2. Workday starts in `not-started`; Start workday changes it to `active`.
   A completed workday from an earlier company business date does not block starting today's workday. An earlier active workday remains active until closed.
3. Open Agenda and use **Actualizar datos** to load visits scheduled from the web. Select a pending visit to open its detail.
4. Register arrival. The visit changes from `pending` to `active`.
5. Complete the visit record with Attended, Closed location or Not attended and optional notes. Commercial image attachment remains optional. An attended Merchandiser visit requires an exhibition audit and a real selected JPEG/PNG/WebP image up to 1 MiB: shelf stock, the reason when stock is absent (trimmed text, at most 1000 characters), brand display and visible prices. Closed/unavailable visits do not require or submit an audit.
6. Finish the visit. Wait for the server response and reload; show the saved record, real timestamps and authenticated image. Return to Agenda to see actual progress.
7. Repeat for remaining planned visits.
8. Return to Workday, open the confirmation and confirm closure. The server saves the workday as `completed`.

## Guards

- Only an authenticated company membership can execute field transitions. Server authorization remains authoritative.
- Arrival requires an active workday and a pending visit.
- Only one visit can be active.
- A visit requires a valid result before finishing.
- An active visit must finish before another begins.
- Normal workday closure requires every due or overdue visit to be completed. Future visits remain visible in Agenda and do not count toward today's progress or block closure.
- Unknown visit IDs and direct links must show a recoverable route rather than crash.
- Logout clears the session after server confirmation. Business history persists and reload fetches it again.
- Unsaved result, notes and attachment selections are component-local drafts. Leaving the record before finishing discards them; no autosave is claimed.

There is no automatic visit start based on the clock. Arrival is an explicit user action. Exhibition audits belong only to attended Merchandiser visits; Commercial has no audit form or audit payload. No order or signature is required in either role's base flow. A historical record without an audit remains readable without fabricated answers.

## Integration and failure boundaries

The server owns timestamps and member-scoped customer/visit/workday state. Native API origin and company hostname must be explicitly configured. Web uses the same-origin BFF cookie through the preview gateway. There is no fixture fallback and no offline acceptance.

Company managers use the web platform. If a manager signs in from mobile, the client displays a web-only message before requesting field data. Commercial and Merchandiser accounts retain the shared mobile workflow.

Map composition remains illustrative: no coordinates, distances or geofence acceptance are fabricated. Agenda displays real scheduled start times in the verified company timezone; planned end times are not supplied by the API.

An uncertain transport or server response retains the original command, body and operation key. **Reintentar operación pendiente** repeats those exact bytes even if the form has since changed. Different commands are refused while one remains uncertain. Confirmed success clears the key before hydration; read failures then offer a fresh read without resending the write. Definitive HTTP 4xx responses release the key. No local mutation substitutes for a server response.

Unsaved drafts and native bearer tokens are memory-only. Selected image bytes are validated before closure; saved evidence is fetched separately on the record view. Gallery permissions and native device behavior require device verification.

## Manual verification

Schedule an assigned customer for an active field member from the authorized company web view, refresh that user's mobile Agenda, complete the flow, reload the saved record, then verify it from web Agenda/Registros/Jornadas. For Merchandiser, verify the attended result requires all audit answers and an exhibition photograph, the no-stock reason appears only for absent stock, and saved answers survive refresh. Verify Closed/Not attended without invented audit data and Commercial closure without an audit. Also try wrong credentials, arrival before workday start, another active visit, finish without result, premature workday close, Back, unknown visit URL, logout/relogin and server outage. Record observed browser/device results in the feature log; automated tests do not prove native gallery behavior.
