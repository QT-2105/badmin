# Acceptance Checklist

Status: Complete - PASS WITH NOTES

This checklist has been reconciled against `08_COMPLETION_REPORT.md`.
Items verified by source review and validation are accepted. Browser-rendered screenshot QA remains deferred and is documented in the completion report.

## Scope

- [ ] Only `/sessions/[sessionId]` presentation was changed.
- [ ] No Runtime/Điều phối file was changed.
- [ ] No Schedule list implementation was changed.
- [ ] No Play Date detail implementation was changed.
- [ ] No API file was changed.
- [ ] No repository file was changed.
- [ ] No service file was changed.
- [ ] No hook file was changed.
- [ ] No Prisma file was changed.
- [ ] No route was renamed.
- [ ] No permission rule was changed.
- [ ] No finance calculation was changed.
- [ ] No inventory calculation was changed.
- [ ] No payment semantics were changed.

## Session Workspace

- [ ] Session data fetch behavior is unchanged.
- [ ] Session title/time/court/status data is unchanged.
- [ ] Start session behavior is unchanged.
- [ ] Runtime navigation still links to `/sessions/[sessionId]/runtime`.
- [ ] Complete session behavior is unchanged.
- [ ] Completion validation is unchanged.
- [ ] Court cost update payload is unchanged.
- [ ] Shuttlecock product selection persistence is unchanged.
- [ ] Shuttlecock usage update payload is unchanged.
- [ ] Profit display uses existing data/calculation source.
- [ ] Session notes behavior is unchanged.
- [ ] Completed-session readonly behavior is unchanged.

## Player Management

- [ ] Add-player form fields are unchanged.
- [ ] Add-player payload is unchanged.
- [ ] Player avatar upload behavior is unchanged.
- [ ] Player avatar delete/default behavior is unchanged.
- [ ] Inline edit fields are unchanged.
- [ ] Update-player payload is unchanged.
- [ ] Delete-player handler and confirmation behavior are unchanged.
- [ ] Payment status/type presentation maps to existing values.
- [ ] Session-scoped player model is preserved.

## Visual Design

- [ ] Page header follows Stage 01/02/03/04 hierarchy.
- [ ] Primary actions are visually primary.
- [ ] Completion information is grouped and scan-friendly.
- [ ] Player add form is compact and readable.
- [ ] Player rows are readable and touch-friendly.
- [ ] Destructive actions use danger tone.
- [ ] Status badges use semantic tones.
- [ ] Card surfaces use semantic tokens.
- [ ] Light mode is legible.
- [ ] Dark mode is legible.
- [ ] No new raw color system is introduced.

## Responsive

- [ ] Desktop 1440px reviewed.
- [ ] Laptop 1280px reviewed.
- [ ] Tablet landscape reviewed.
- [ ] Tablet portrait reviewed.
- [ ] Mobile smoke test reviewed.
- [ ] Forms do not clip action buttons.
- [ ] Player rows wrap without overlap.
- [ ] Long player names do not break layout.
- [ ] Avatar controls remain usable on touch devices.

## Accessibility

- [ ] Icon-only buttons have accessible labels.
- [ ] Focus remains visible on buttons, links, selects, inputs, and upload controls.
- [ ] Disabled buttons are distinguishable.
- [ ] Status badges are not the only source of critical action permission.
- [ ] Links remain keyboard reachable.
- [ ] Avatar upload control remains keyboard reachable.
- [ ] Completion validation messages remain visible.

## Validation

- [ ] `npm run lint` passed.
- [ ] `npm run typecheck` passed.
- [ ] `npm run build` passed.
- [ ] `npm run guard:no-db-schema-automation` passed.
- [ ] Protected diff is clean.

## Final Decision

One of:

- PASS
- PASS WITH NOTES
- FAIL
