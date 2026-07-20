# Implementation Tasks

Status: Completed - PASS WITH NOTES

Source code changed: Yes - presentation-only changes completed

Completion report: `08_COMPLETION_REPORT.md`

## Task 0 - Baseline

File sửa:

- none

Files to read:

- `src/components/schedule/session-detail-client.tsx`
- `src/app/sessions/[sessionId]/page.tsx`
- Stage 05 docs

Protected files:

- all protected files listed in `05_IMPLEMENTATION_PLAN.md`

Shared components:

- none

Validation commands:

```bash
git status --short
git diff -- src/app/api src/repositories src/services src/hooks prisma src/lib/badminton-store.ts
```

Completion criteria:

- Baseline dirty files recorded.
- Protected diff recorded.
- No source code changed.

## Task 1 - Header

File sửa:

- `src/components/schedule/session-detail-client.tsx`

Protected files:

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/**`
- `src/lib/auth/**`
- `src/lib/session-status.ts`
- runtime protected files

Shared components:

- `PageShell`
- `PageHeader`
- `Button`
- `StatusBadge`

Validation commands:

```bash
npm run lint
npm run typecheck
```

Completion criteria:

- Header uses shared page layout/header where safe.
- Back route remains unchanged.
- Session title/time/court/status source remains unchanged.
- Start/complete/runtime action visibility and disabled logic remain unchanged.

## Task 2 - Session Summary

File sửa:

- `src/components/schedule/session-detail-client.tsx`

Protected files:

- hooks
- services
- repositories
- calculations

Shared components:

- `StatCard`
- `Surface`

Validation commands:

```bash
npm run lint
npm run typecheck
```

Completion criteria:

- Time, player count, and expected revenue are visually compact.
- Existing values and calculation sources are unchanged.
- No new KPI is added.

## Task 3 - Player List

File sửa:

- `src/components/schedule/session-detail-client.tsx`

Protected files:

- player hooks
- player services
- player repositories
- payment logic helpers

Shared components:

- `Surface`
- `FormSection`
- `StatusBadge`
- `EmptyState`
- `Button`

Validation commands:

```bash
npm run lint
npm run typecheck
```

Completion criteria:

- Add-player form remains functionally identical.
- Player rows remain clickable for quick view.
- Inline edit behavior remains unchanged.
- Delete behavior remains unchanged.
- Avatar upload/delete behavior remains unchanged.
- Player list remains touch-friendly and compact.

## Task 4 - Finance Summary

File sửa:

- `src/components/schedule/session-detail-client.tsx`

Protected files:

- finance services/repositories
- completion hooks
- payment calculation expressions

Shared components:

- `Surface`
- `StatusBadge`

Validation commands:

```bash
npm run lint
npm run typecheck
```

Completion criteria:

- Cash, bank transfer, and unpaid totals are easier to scan.
- Existing `playerFinance` and `paymentTotals` logic is unchanged.
- Payment badges map to existing values.

## Task 5 - Court Summary

File sửa:

- `src/components/schedule/session-detail-client.tsx`

Protected files:

- completion hooks
- schedule services/repositories
- finance generation logic

Shared components:

- `FormSection`
- `Surface`
- `Button`

Validation commands:

```bash
npm run lint
npm run typecheck
```

Completion criteria:

- Court cost input is compact and readable.
- Court cost state and update payload are unchanged.
- Disabled/readonly behavior is unchanged.

## Task 6 - Shuttle Summary

File sửa:

- `src/components/schedule/session-detail-client.tsx`

Protected files:

- inventory hooks
- inventory services/repositories
- shuttlecock movement logic
- completion hooks

Shared components:

- `FormSection`
- `Surface`
- `Button`

Validation commands:

```bash
npm run lint
npm run typecheck
```

Completion criteria:

- Shuttlecock product and usage fields are compact and readable.
- Product id/name fallback logic is unchanged.
- Usage cost calculation is unchanged.
- Update and completion payloads are unchanged.

## Task 7 - Primary Actions

File sửa:

- `src/components/schedule/session-detail-client.tsx`

Protected files:

- permissions
- session status helpers
- route files
- runtime files

Shared components:

- `Button`
- optional `ActionMenu` for secondary actions only

Validation commands:

```bash
npm run lint
npm run typecheck
```

Completion criteria:

- `Bắt đầu ca` remains governed by existing status, permission, and player eligibility.
- `Hoàn tất ca` remains governed by existing status, permission, and validation.
- `Điều phối` remains a contextual link to `/sessions/[sessionId]/runtime`.
- No primary action is hidden in a menu.

## Task 8 - Responsive

File sửa:

- `src/components/schedule/session-detail-client.tsx`

Protected files:

- all business/protected files

Shared components:

- existing primitives only

Validation commands:

```bash
npm run lint
npm run typecheck
```

Completion criteria:

- Desktop 1440px is reviewable.
- Laptop 1280px is reviewable.
- Tablet landscape is reviewable.
- Tablet portrait is reviewable.
- Mobile smoke layout is reviewable.
- Forms and player rows do not clip important controls.

## Task 9 - Accessibility

File sửa:

- `src/components/schedule/session-detail-client.tsx`

Protected files:

- all business/protected files

Shared components:

- `Button`
- `StatusBadge`
- feedback primitives

Validation commands:

```bash
npm run lint
npm run typecheck
```

Completion criteria:

- Icon-only buttons have accessible labels.
- Focus remains visible.
- Disabled states remain distinguishable.
- Upload controls remain keyboard reachable.
- Player row quick-view behavior remains keyboard reachable.

## Task 10 - Validation

File sửa:

- none unless a validation-only fix is required

Protected files:

- all protected files listed in `05_IMPLEMENTATION_PLAN.md`

Shared components:

- none

Validation commands:

```bash
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
git diff -- src/app/api src/repositories src/services src/hooks prisma src/lib/badminton-store.ts src/lib/auth src/lib/date-format.ts src/lib/session-status.ts src/lib/player-labels.ts src/types/domain.ts
```

Completion criteria:

- Lint passes.
- Typecheck passes.
- Build passes.
- DB schema guard passes.
- Protected diff is clean.
- Any validation issue is fixed only if it does not touch protected logic.

## Task 11 - Completion Report

File sửa:

- `docs/ui-spec/stage-05-session-workspace/08_COMPLETION_REPORT.md`
- `docs/ui-spec/PROJECT_PROGRESS.md`

Protected files:

- all protected files listed in `05_IMPLEMENTATION_PLAN.md`

Shared components:

- none

Validation commands:

```bash
git diff -- docs/ui-spec/stage-05-session-workspace/08_COMPLETION_REPORT.md docs/ui-spec/PROJECT_PROGRESS.md
git diff -- src/app/api src/repositories src/services src/hooks prisma src/lib/badminton-store.ts src/lib/auth src/lib/date-format.ts src/lib/session-status.ts src/lib/player-labels.ts src/types/domain.ts
```

Completion criteria:

- Completion report records Task 0-10 status.
- Project progress is updated.
- Business logic unchanged is confirmed.
- Protected diff is clean.
- Final decision is stated.
