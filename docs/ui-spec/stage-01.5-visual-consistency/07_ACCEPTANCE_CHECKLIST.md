# Stage 01.5 Acceptance Checklist

## Functional Safety

- [ ] No API route changes
- [ ] No Prisma/schema changes
- [ ] No repository changes
- [ ] No service changes
- [ ] No business hook changes
- [ ] No Zustand runtime logic changes
- [ ] No permission logic changes
- [ ] No route changes
- [ ] No finance calculation changes
- [ ] No inventory calculation changes

## Visual Consistency

- [ ] Page headers use consistent hierarchy
- [ ] Section titles are visually distinct from body text
- [ ] KPI text uses consistent numeric hierarchy
- [ ] Cards use consistent radius, border, shadow
- [ ] Buttons map to shared variants where safe
- [ ] Inputs/selects/textareas use shared styling where safe
- [ ] Badges/status chips use semantic color tokens
- [ ] Pagination is visually consistent
- [ ] Empty/loading/error states are consistent

## Token Adoption

- [ ] Hard-coded palette classes reduced in non-protected UI
- [ ] Semantic colors used for income, expense, profit, inventory, warning, danger, info
- [ ] Light mode remains readable
- [ ] Dark mode remains readable
- [ ] Focus states are visible

## Responsive Safety

- [ ] Tablet landscape remains usable
- [ ] Smartphone portrait remains usable
- [ ] Horizontal data areas provide scroll where needed
- [ ] Large touch targets are preserved

## Protected Runtime Safety

- [ ] Runtime lifecycle unchanged
- [ ] Waiting queue semantics unchanged
- [ ] Next-match orchestration unchanged
- [ ] Court lifecycle unchanged
- [ ] Operator-first controls unchanged
- [ ] DB call timing unchanged

## Validation

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run guard:no-db-schema-automation`

## Audit Status - 2026-07-14

This section records the status after the Visual Consistency Audit. It does not mark implementation complete.

### Functional Safety

- [x] No API route changes in Stage 01.5 audit
- [x] No Prisma/schema changes in Stage 01.5 audit
- [x] No repository changes in Stage 01.5 audit
- [x] No service changes in Stage 01.5 audit
- [x] No business hook changes in Stage 01.5 audit
- [x] No Zustand runtime logic changes in Stage 01.5 audit
- [x] No permission logic changes in Stage 01.5 audit
- [x] No route changes in Stage 01.5 audit
- [x] No finance calculation changes in Stage 01.5 audit
- [x] No inventory calculation changes in Stage 01.5 audit

### Visual Consistency Audit Result

- [ ] Page headers use consistent hierarchy across all screens
  - Deferred: play date detail, session detail, runtime, login.
- [ ] Section titles are visually distinct from body text across all screens
  - Deferred: session detail, runtime, settings, schedule cards.
- [ ] KPI text uses consistent numeric hierarchy across all screens
  - Deferred: runtime stats and some custom dashboard/chart areas.
- [ ] Cards use consistent radius, border, shadow across all screens
  - Deferred: session detail, runtime, settings, login.
- [ ] Buttons map to shared variants where safe
  - Deferred: app shell icon controls, users save button, settings actions, runtime controls.
- [ ] Inputs/selects/textareas use shared styling where safe
  - Deferred: users, settings, session detail, inventory helper forms, runtime player list.
- [ ] Badges/status chips use semantic color tokens
  - Deferred: finance, inventory, schedule tags, users roles/status, runtime tags.
- [ ] Pagination is visually consistent
  - Mostly aligned; future list/table wrapper can improve row/header consistency.
- [ ] Empty/loading/error states are consistent
  - Deferred: session detail, runtime, settings, some auth/user states.

### Token Adoption Audit Result

- [ ] Hard-coded palette classes reduced in non-protected UI
  - Deferred: session detail, settings danger zones, login, user role matrix, chart colors.
- [ ] Semantic colors used for income, expense, profit, inventory, warning, danger, info
  - Mostly aligned in `MetricCard`; deferred for badges, chart, and protected runtime.
- [ ] Light mode remains readable
  - Deferred P0/P1: session detail, runtime, player quick view, danger/reset areas.
- [ ] Dark mode remains readable
  - Mostly aligned; runtime and dense session detail still need token cleanup.
- [ ] Focus states are visible
  - Deferred: custom buttons/inputs in runtime, session detail, settings, users.

### Responsive Safety Audit Result

- [ ] Tablet landscape remains usable after implementation
  - Must be verified during source migration.
- [ ] Smartphone portrait remains usable after implementation
  - Must be verified during source migration.
- [ ] Horizontal data areas provide scroll where needed
  - Mostly present in finance, inventory, users; must be preserved.
- [ ] Large touch targets are preserved
  - Must be preserved especially in runtime and session detail.

### Protected Runtime Safety Audit Result

- [x] Runtime lifecycle unchanged in audit
- [x] Waiting queue semantics unchanged in audit
- [x] Next-match orchestration unchanged in audit
- [x] Court lifecycle unchanged in audit
- [x] Operator-first controls unchanged in audit
- [x] DB call timing unchanged in audit

### Validation Status

Not run for this audit-only documentation pass. Required before any Stage 01.5 source implementation is marked complete:

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run build`
- [ ] `npm run guard:no-db-schema-automation`
