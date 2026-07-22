# Sprint 11.6 — Current Mobile Audit

## Dashboard

- Page header actions rendered as compact inline buttons. On 390px they can wrap but are harder to tap and scan.
- Report filter uses existing `FilterBar` stack behavior and full-width compact controls.
- KPI cards stack to one column and remain readable.
- Chart and recent sessions use local horizontal scroll; no page-level horizontal scroll expected.

Priority: P1.

## Schedule

- Create-day form stacks safely below `md`.
- Day cards are already card view and keep session status/action labels.
- Session list toggle was 32px high, below preferred mobile action target.

Priority: P1.

## Finance

- Report filters and form fields stack safely.
- Manual entry toggle was compact and should be full-width on mobile.
- Transaction list must remain a responsive table because column names and numeric alignment are important for finance review.

Priority: P1.

## Inventory

- KPI cards stack safely.
- Product and movement lists must remain responsive tables to preserve inventory column semantics.
- Product-form open/cancel actions should be full-width on mobile.
- Stock operation buttons are already full-width mobile actions.

Priority: P1.

## Users

- Create-user form stacks safely on mobile.
- Create action should be full-width on mobile.
- User management list remains a responsive table because inline edit fields and role/status/password controls require explicit columns.

Priority: P1.

## Settings

- Navigation was optimized in Sprint 11.5 as a mobile/tablet horizontal strip.
- Branding save/upload actions should be full-width on mobile to avoid cramped adjacent controls.
- Existing settings sections should remain current workflow and not create new configuration capabilities.

Priority: P1.

## Runtime Smoke

- Runtime tablet-first work remains protected.
- Mobile top actions and suggestion mode controls were raised to 40px in Sprint 11.5.
- No further Runtime source changes needed in Sprint 11.6.

Priority: P2.
