# Sprint 11.5 — Implementation Plan

## Task 1 — Runtime Touch Targets

Files:

- `src/components/realtime-dashboard.tsx`

Plan:

- Increase mobile Runtime top actions from 32px to 40px height.
- Increase suggestion mode selector buttons from 28px to 40px height.
- Preserve button labels, handlers, arguments, disabled conditions, and state source.

Validation:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Task 2 — Schedule Tablet Forms

Files:

- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`

Plan:

- Keep create-day/create-session/edit-session forms at two columns on tablet.
- Move dense custom columns to `xl`.
- Preserve input names, values, state setters, submit handlers, validation, and permissions.

Validation:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Task 3 — Session Workspace Tablet Forms

Files:

- `src/components/schedule/session-detail-client.tsx`

Plan:

- Keep completion draft and player forms at two columns on tablet.
- Move dense custom player-row/edit grids to `xl`.
- Preserve player CRUD, avatar, payment, completion, finance, inventory, and runtime behavior.

Validation:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Task 4 — Settings Tablet Navigation

Files:

- `src/components/settings/settings-page-client.tsx`

Plan:

- Change tablet navigation from multi-row grid to horizontal section strip.
- Keep desktop grid for larger widths.
- Preserve section IDs, active state, click handler, and danger state.

Validation:

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Runtime Regression

Confirm by code review and protected diff:

- Queue ordering unchanged.
- Pairing unchanged.
- Court assignment unchanged.
- Match lifecycle unchanged.
- Zustand state unchanged.
- Apply/start/end handlers unchanged.
