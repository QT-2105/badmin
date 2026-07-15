# Implementation Tasks

Status: Planned, not implemented

Source code changed: No

## Task 0 - Baseline and Protected Diff

Files to modify: none

Files to read:

- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`
- `src/app/schedule/page.tsx`
- `src/app/schedule/[playDateId]/page.tsx`
- Stage 04 docs

Protected files: all protected files listed in `05_IMPLEMENTATION_PLAN.md`

Shared components: none

Logic to preserve: all

Risk: none if read-only

Validation:

```bash
git status --short
git diff -- src/app/api src/repositories src/services src/hooks prisma src/lib/badminton-store.ts
```

Done when baseline dirty files and protected diff are recorded.

## Task 1 - PageHeader and Top-Level Layout

Files to modify:

- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`

Files to read:

- `src/components/ui/page-layout.tsx`

Protected files: routes, hooks, services, repositories, runtime

Shared components:

- `PageShell`
- `PageHeader`

Logic to preserve:

- route behavior
- data fetching
- page auth
- descriptions may change but workflow must not

Risk:

- changing action placement could imply new workflow

Validation:

```bash
npm run lint
npm run typecheck
```

Done when headers are visually aligned and no business behavior changes.

## Task 2 - Form Tạo Ngày

Files to modify:

- `src/components/schedule/schedule-page-client.tsx`

Files to read:

- `src/components/ui/form-section.tsx`
- `src/components/ui/form.tsx`
- `src/components/ui/button.tsx`

Protected files: hooks, services, repositories, API

Shared components:

- `FormSection`
- `Input`
- `Button`

Logic to preserve:

- `playDate`, `title`, `note` state
- `min={today}`
- `submit(event)`
- `createPlayDate.mutateAsync({ playDate, title, note })`
- pending disabled state
- action error behavior

Risk:

- accidental form submit/payload change

Validation:

```bash
npm run lint
npm run typecheck
```

Done when form is visually compact and payload unchanged.

## Task 3 - DayCard

Files to modify:

- `src/components/schedule/schedule-page-client.tsx`

Files to read:

- `src/components/ui/surface.tsx`
- `src/components/ui/status-badge.tsx`
- `src/components/ui/action-menu.tsx`

Protected files: hooks, services, repositories, API, runtime

Shared components:

- `Surface` / `Card`
- `StatusBadge`
- `Button`
- optional `ActionMenu`

Logic to preserve:

- `sortedPlayDates`
- `isPast`, `isToday`, `hasIncompleteSession`
- `expandedDateIds`
- quick session routes
- day detail route
- delete route and handler

Risk:

- moving delete into menu could reduce clarity; keep detail primary

Validation:

```bash
npm run lint
npm run typecheck
```

Done when cards are easier to scan and states remain semantically identical.

## Task 4 - Empty, Loading, and Error States for Schedule List

Files to modify:

- `src/components/schedule/schedule-page-client.tsx`

Files to read:

- `src/components/ui/feedback.tsx`

Protected files: all protected files

Shared components:

- `EmptyState`
- `LoadingState`
- `ErrorState`
- `WarningState`

Logic to preserve:

- `isLoading`
- `error`
- `actionError`
- `playDates.length === 0`
- exact API/mutation message source

Risk:

- swallowing API validation errors

Validation:

```bash
npm run lint
npm run typecheck
```

Done when states are consistent and conditions unchanged.

## Task 5 - Header Trang Chi Tiết Ngày

Files to modify:

- `src/components/schedule/play-date-detail-client.tsx`

Files to read:

- `src/components/ui/page-layout.tsx`

Protected files: route page and hooks

Shared components:

- `PageHeader`

Logic to preserve:

- title fallback
- description date/session count
- backAction route `/schedule`

Risk:

- changing back route

Validation:

```bash
npm run lint
npm run typecheck
```

Done when detail header is clear and route unchanged.

## Task 6 - Form Tạo Ca

Files to modify:

- `src/components/schedule/play-date-detail-client.tsx`

Files to read:

- `src/components/ui/form-section.tsx`
- `src/components/ui/form.tsx`

Protected files: hooks, services, repositories, settings logic

Shared components:

- `FormSection`
- `Input`
- `Button`

Logic to preserve:

- `name`, `startTime`, `endTime`, `courtCount`, `note`
- `maxCourtCount`
- `isPastPlayDate`
- `canManageSessions`
- `submit(event)`
- `createPlaySession` payload

Risk:

- changing validation timing or court-count semantics

Validation:

```bash
npm run lint
npm run typecheck
```

Done when form is compact and create behavior unchanged.

## Task 7 - SessionCard or SessionRow

Files to modify:

- `src/components/schedule/play-date-detail-client.tsx`

Files to read:

- `src/components/ui/status-badge.tsx`
- `src/components/ui/surface.tsx`
- `src/lib/session-status.ts` read-only

Protected files: session status helpers, hooks, services, repositories

Shared components:

- `Surface` / `Card`
- `StatusBadge`
- `Button`

Logic to preserve:

- `sortedSessions`
- `canModify`
- `editingSessionId`
- `beginEditSession`
- `removeSession`
- detail route

Risk:

- changing editable state visibility

Validation:

```bash
npm run lint
npm run typecheck
```

Done when session cards clearly show time/court/status and primary detail action.

## Task 8 - ActionMenu and Confirm UI

Files to modify:

- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`

Files to read:

- `src/components/ui/action-menu.tsx`
- `src/components/ui/dialog.tsx` read-only only

Protected files: handlers and services

Shared components:

- optional `ActionMenu`

Logic to preserve:

- existing delete handlers
- `window.confirm` behavior
- disabled rules

Risk:

- replacing confirm flow without approval

Validation:

```bash
npm run lint
npm run typecheck
```

Done when secondary actions are visually cleaner without changing confirmation.

## Task 9 - Light/Dark Mode

Files to modify:

- Schedule component files only

Files to read:

- `src/app/globals.css`
- Stage 01 token docs

Protected files: all business/protected files

Shared components:

- semantic-token primitives only

Logic to preserve: all

Risk:

- hard-coded dark-only colors

Validation:

```bash
npm run lint
npm run typecheck
```

Done when no new raw color tokens are introduced and both modes remain legible.

## Task 10 - Responsive Desktop/Tablet/Mobile

Files to modify:

- Schedule component files only

Files to read:

- source JSX and shared primitive APIs

Protected files: all business/protected files

Shared components: no new component requirement

Logic to preserve: all

Risk:

- action buttons wrapping badly or clipped on tablet/mobile

Validation:

```bash
npm run lint
npm run typecheck
```

Done when desktop, laptop, tablet landscape, tablet portrait, and mobile layouts are reviewable.

## Task 11 - Accessibility

Files to modify:

- Schedule component files only

Files to read:

- shared primitives

Protected files: all business/protected files

Shared components:

- `Button`
- `ActionMenu`
- feedback primitives

Logic to preserve: all

Risk:

- icon-only buttons lacking labels

Validation:

```bash
npm run lint
npm run typecheck
```

Done when icon-only actions have labels, focus remains visible, and disabled states are clear.

## Task 12 - Validation and Completion Report

Files to modify:

- `docs/ui-spec/stage-04-schedule/08_COMPLETION_REPORT.md`
- `docs/ui-spec/PROJECT_PROGRESS.md`

Files to read:

- all changed files

Protected files: all protected files

Shared components: none

Logic to preserve: all

Validation:

```bash
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
git diff -- src/app/api src/repositories src/services src/hooks prisma src/lib/badminton-store.ts src/lib/auth src/lib/date-format.ts src/lib/session-status.ts
```

Done when validation is recorded and final decision is stated.
