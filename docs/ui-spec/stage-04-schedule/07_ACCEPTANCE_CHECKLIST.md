# Acceptance Checklist

Status: Complete - PASS WITH NOTES

This checklist has been reconciled against `08_COMPLETION_REPORT.md`.
Items verified by source review and validation are accepted. Browser-rendered screenshot QA remains deferred and is documented in the completion report.

## Scope

- [ ] Only `/schedule` was changed.
- [ ] Only `/schedule/[playDateId]` was changed.
- [ ] No Runtime/Điều phối file was changed.
- [ ] No Session Detail implementation was changed.
- [ ] No API file was changed.
- [ ] No repository file was changed.
- [ ] No service file was changed.
- [ ] No hook file was changed.
- [ ] No Prisma file was changed.
- [ ] No route was renamed.
- [ ] No permission rule was changed.

## Trang Lịch Chơi

- [ ] `usePlayDates()` behavior is unchanged.
- [ ] `useScheduleMutations()` behavior is unchanged.
- [ ] Play dates still sort newest first.
- [ ] Create day form still uses `playDate`, `title`, `note`.
- [ ] Create day still sends `{ playDate, title, note }`.
- [ ] Date input still uses `min={today}`.
- [ ] Delete day still uses the existing delete handler.
- [ ] Delete day still confirms before mutation.
- [ ] Past days cannot be deleted.
- [ ] Today indicator remains visible.
- [ ] Incomplete-session indicator remains visible.
- [ ] Review-only state remains visible for past days.
- [ ] `Chi tiết ngày` still links to `/schedule/[playDateId]`.
- [ ] Quick session rows still link to `/sessions/[sessionId]`.
- [ ] Empty state still shows only when there are no play dates.
- [ ] Loading and error states preserve existing conditions and message sources.

## Trang Chi Tiết Ngày

- [ ] `usePlayDate(playDateId)` behavior is unchanged.
- [ ] `useScheduleMutations(playDateId)` behavior is unchanged.
- [ ] `useAppSettings()` behavior is unchanged.
- [ ] Sessions still sort by earliest start time.
- [ ] Create session form still uses `name`, `startTime`, `endTime`, `courtCount`, `note`.
- [ ] Create session payload is unchanged.
- [ ] Max court count validation is unchanged.
- [ ] Past dates cannot create sessions.
- [ ] Edit/delete are available only when existing `canModify` is true.
- [ ] `normalizeSessionStatus(session.status) === 'PENDING'` rule is unchanged.
- [ ] Inline edit workflow is unchanged.
- [ ] Update session payload is unchanged.
- [ ] Delete session confirmation and mutation are unchanged.
- [ ] `Chi tiết ca` still links to `/sessions/[sessionId]`.
- [ ] Empty state still shows only when selected date has no sessions.
- [ ] Loading and error states preserve existing conditions and message sources.

## Visual Design

- [ ] Page headers follow Stage 01/02/03 hierarchy.
- [ ] No English eyebrow is introduced.
- [ ] Create forms are compact but still readable.
- [ ] Day cards show day/date/session state clearly.
- [ ] Session cards show name/time/court/status clearly.
- [ ] Primary actions are visually primary.
- [ ] Edit/delete are secondary.
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
- [ ] Card actions wrap without overlap.
- [ ] Long titles/notes do not break layout.

## Accessibility

- [ ] Icon-only buttons have accessible labels.
- [ ] Focus remains visible on buttons, links, and menu triggers.
- [ ] Disabled buttons are distinguishable.
- [ ] Status badges are not the only source of critical action permission.
- [ ] Links remain keyboard reachable.
- [ ] Action menus, if used, keep keyboard behavior.

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
