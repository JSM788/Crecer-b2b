# Basic commercial visit flow

## Happy path

1. Open Login and use the displayed fictional account.
2. Workday starts in `not-started`; Start workday changes it to `active`.
3. Open Agenda. Select a pending visit to open its detail.
4. Register arrival. The visit changes from `pending` to `active`.
5. Complete the visit record with Attended, Closed location or Not attended, optional notes and optional simulated attachment.
6. Finish the visit. Show its saved record and return to Agenda; progress becomes 1/2.
7. Repeat for the second visit. Progress becomes 2/2.
8. Return to Workday, open the confirmation and confirm closure. Workday becomes `completed`.

## Guards

- Only an authenticated demo session can execute field transitions.
- Arrival requires an active workday and a pending visit.
- Only one visit can be active.
- A visit requires a valid result before finishing.
- An active visit must finish before another begins.
- Normal workday closure requires every scheduled visit to be completed.
- Unknown visit IDs and direct links must show a recoverable route rather than crash.
- Logout keeps scenario progress in memory; reload and Reset clear it.
- Unsaved result, notes and attachment selections are component-local drafts. Leaving the record before finishing discards them; no autosave is claimed.

There is no automatic visit start based on the clock. Arrival is an explicit user action. There is no order requirement, shelf audit or signature in this basic flow.

## Simulation boundaries

All location values and timestamps come from the fixture scenario. No geofence or antifraud verification takes place. The optional attachment represents only a visual selection state. Saved records remain in memory and are not sent anywhere. A saved confirmation must not claim server delivery.

The fixed timestamps illustrate the scheduled visit order. Alternate visit orders are allowed, but their timestamps still follow the predefined scenario; this is not a live chronological tracking simulation.

## Manual verification

Complete the happy path, refresh and confirm reset. Also try a wrong password, arrival before workday start, a second arrival during an active visit, finish without result, premature workday close, browser Back, unknown visit URL and logout/relogin. Record observed results in the feature log.
