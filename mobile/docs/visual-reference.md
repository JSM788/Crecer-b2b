# Visual reference contract

The approved raster mockups are the source of truth for screen composition. Do not introduce another palette, brand mark, promotional text, typography or navigation pattern without explicit approval.

## Reference ownership

| Views                                               | Repository reference                                                    |
| --------------------------------------------------- | ----------------------------------------------------------------------- |
| Login, workday before/after start, agenda           | `imagenes/mobile-flujo-basico-v2/01-acceso-jornada-agenda.png`          |
| Visit detail, editable/saved record, updated agenda | `imagenes/mobile-flujo-basico-v2/02-detalle-registro-cierre-visita.png` |
| Agenda complete, workday ready, confirmation, ended | `imagenes/mobile-flujo-basico-v2/03-cierre-jornada.png`                 |

## Acceptance checklist

- Triangle outline in black square; larger login brand and compact authenticated brand/profile row.
- Condensed typeface, black primary controls, white surfaces, neutral borders and small radii. Green only in success feedback explicitly shown in the reference.
- Login: original welcome copy, white outlined inputs, plain black button, bottom informational panel.
- Workday: date under title, compact summary rows, scheduled customer cards, bottom action. No oversized progress panel.
- Agenda: date row, schedule ranges, customer/status cards and secondary calendar actions.
- Visit: contact/schedule cards, monochrome illustrative map, geographic values and arrival action.
- Record: compact result rows, observations, optional attachment; saved state has tabular outcome/times.
- Active bottom tab is black with white label/icon. Workday confirmation is a bottom sheet.
- Compare at 390×844 and check compact 320×720 layouts. Exclude device frame, operating-system clock and sheet annotations from comparison.

## Truthful prototype labels

Reference images contain illustrative claims about device drafts, GPS and server sending. Preserve their visual placement while describing actual in-memory demo behavior. These phrases do not authorize claiming operational integrations.

## Verification

Check every view and start/active/saved/ended state after a shared theme change. Functional tests alone do not establish visual fidelity. Keep domain guards unchanged during layout corrections.
