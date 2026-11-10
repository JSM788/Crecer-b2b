# Capture Merchandiser exhibition audits with visit closure

An attended Merchandiser visit now records the approved exhibition questions and a real image through the existing visit record. Commercial closure and both roles' workday/arrival mechanics remain shared.

## Contract

`FINISH_VISIT` optionally includes `audit`: `hasShelfStock` (boolean), `noStockReason` (trimmed text, required when stock is absent, at most 1000 characters), `brandDisplay` (`adequate` or `inadequate`) and `pricesVisible` (boolean). An attended Merchandiser needs all answers and the existing `attachment`; Commercial and closed/unavailable outcomes cannot send an audit.

The mobile guard checks role and required content before transport. The API normalizes typed answers, includes them in the same idempotent body, and validates optional/nullable audit data returned in agenda records. The server remains authoritative and persists closure, audit and image atomically. Historical records without an audit remain readable without synthesized answers.

## UI and alternatives

The approved M09 exhibition question composition supplies the form fields. Its Commercial profile and sales navigation conflict with the later role boundary and are not adopted. The existing five views, brand, compact cards and selected black controls remain; no new audit destination is necessary for this base flow. The no-stock reason uses required free text because no authoritative dropdown taxonomy exists.

Device camera/GPS, offline acceptance and background synchronization are not added. Image selection uses the existing real gallery integration. Native permissions, gallery behavior and visual checks on physical devices still require device verification.
