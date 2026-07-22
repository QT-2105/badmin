# Sprint 11.6 — Implementation Plan

## Task 1 — Dashboard Mobile Actions

Files:

- `src/components/dashboard/dashboard-page-client.tsx`

Plan:

- Make header quick links and recent-session CTA full-width at mobile and auto-width from `sm`.
- Keep routes and labels unchanged.

## Task 2 — Schedule Mobile Touch Target

Files:

- `src/components/schedule/schedule-page-client.tsx`

Plan:

- Increase session-list toggle height to 40px.
- Keep expand/collapse handler and label unchanged.

## Task 3 — Finance Mobile Form Action

Files:

- `src/components/finance/finance-page-client.tsx`

Plan:

- Make manual-entry expand/collapse action full-width at mobile and auto-width from `sm`.
- Keep form open state, transaction fields, submit handler, filters, sort, pagination, and payload unchanged.

## Task 4 — Inventory Mobile Actions

Files:

- `src/components/inventory/inventory-page-client.tsx`

Plan:

- Make product form open/cancel actions full-width at mobile and auto-width from `sm`.
- Keep product/movement logic, payloads, filters, sorting, and pagination unchanged.

## Task 5 — Users Mobile CTA

Files:

- `src/components/users/auth-users-panel.tsx`

Plan:

- Make create-user CTA full-width at mobile.
- Keep role/status/password fields, handlers, permission behavior, and payload unchanged.

## Task 6 — Settings Mobile Actions

Files:

- `src/components/settings/settings-page-client.tsx`

Plan:

- Make branding save/reset/logo actions full-width at mobile.
- Keep config keys, mutation handlers, upload/delete behavior, and local settings behavior unchanged.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run guard:no-db-schema-automation`
