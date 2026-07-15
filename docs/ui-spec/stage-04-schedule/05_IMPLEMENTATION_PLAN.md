# Implementation Plan

Status: Planned, not implemented

Source code changed: No

## Plan Rule

Do not implement Stage 04 until this plan is accepted.

Stage 04 implementation may only modify presentation in:

- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`

All business behavior stays in the existing source.

## Files Planned for Modification

Implementation candidates:

- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`

Documentation/reporting:

- `docs/ui-spec/stage-04-schedule/08_COMPLETION_REPORT.md`
- `docs/ui-spec/PROJECT_PROGRESS.md`

## Files to Read Only

- `src/app/schedule/page.tsx`
- `src/app/schedule/[playDateId]/page.tsx`
- `src/hooks/use-play-dates.ts`
- `src/services/schedule-service.ts`
- `src/repositories/play-dates-repository.ts`
- `src/repositories/play-sessions-repository.ts`
- `src/types/domain.ts`
- `src/lib/date-format.ts`
- `src/lib/session-status.ts`
- `src/lib/auth/permissions.ts`
- `src/components/ui/*`

## Protected Files

Absolute no-edit list:

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/**`
- `src/lib/badminton-store.ts`
- `src/lib/auth/**`
- `src/lib/date-format.ts`
- `src/lib/session-status.ts`
- `src/types/domain.ts`
- `prisma/**`
- `src/components/schedule/session-detail-client.tsx`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/**`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`

## Shared Components to Use

Primary:

- `PageShell`
- `PageHeader`
- `FormSection`
- `Surface` / `Card`
- `Button`
- `Input`
- `StatusBadge`
- `ActionMenu`
- `EmptyState`
- `LoadingState`
- `ErrorState`
- `WarningState`
- `Skeleton`
- `Separator`

Conditional:

- `SectionCard` may remain when safer than migrating.
- `NoticeCard` may remain when feedback migration would add churn.

Not planned:

- `DataTable`
- `Dialog`
- `Drawer`
- `FilterBar`
- `StatCard`
- new shared primitives

## Logic That Must Stay Identical

Schedule list:

- `usePlayDates()`
- `useCurrentUser()`
- `useScheduleMutations()`
- `todayDateInput()`
- `isPastDateInput(...)`
- `sortedPlayDates` sort by `right.playDate.localeCompare(left.playDate)`
- `hasIncompleteSessions`
- `expandedDateIds`
- `createPlayDate.mutateAsync({ playDate, title, note })`
- `deletePlayDate.mutateAsync(id)`
- `window.confirm('Xóa ngày chơi này?')`
- links to `/schedule/${item.id}` and `/sessions/${session.id}`

Play date detail:

- `usePlayDate(playDateId)`
- `useScheduleMutations(playDateId)`
- `useAppSettings()`
- `settings.maxCourtCountPerSession`
- `sortedSessions` sort by `startTime`
- `canManageSessions`
- `isPastPlayDate`
- `normalizeSessionStatus(session.status) === 'PENDING'`
- `createPlaySession` payload
- `updatePlaySession` payload
- `deletePlaySession` handler and confirm
- link to `/sessions/${session.id}`

## Task Order

1. Baseline and protected diff.
2. PageHeader and top-level layout.
3. Create play date form.
4. DayCard presentation.
5. Schedule loading/error/empty states.
6. Play date detail header.
7. Create session form.
8. SessionCard/SessionRow presentation.
9. ActionMenu and confirm UI audit.
10. Light/dark mode pass.
11. Responsive desktop/tablet/mobile pass.
12. Accessibility pass.
13. Validation and completion report.

Each task must be reviewable and rollbackable on its own.

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Accidentally changing mutation payloads while moving JSX | High | Keep handlers and payload objects unchanged; compare diff before validation. |
| Hiding delete/edit behind menu and changing discoverability | Medium | Keep primary action visible; only move secondary actions if accepted. |
| Migrating `window.confirm` to `Dialog` and changing flow | High | Do not migrate confirmation UI in Stage 04 unless separately approved. |
| Adding domain logic to shared components | High | Keep domain logic in Schedule components. |
| Breaking permission/past-date gating | High | Do not edit condition expressions. |
| Responsive form wrapping causing clipped actions | Medium | Validate 1440, 1280, tablet, mobile. |
| Light mode contrast regression | Medium | Use tokens only and inspect in browser if implementation reaches QA. |

## Validation Commands

After implementation tasks:

```bash
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
```

Protected diff check:

```bash
git diff -- src/app/api src/repositories src/services src/hooks prisma src/lib/badminton-store.ts src/lib/auth src/lib/date-format.ts src/lib/session-status.ts src/components/realtime-dashboard.tsx src/components/sections src/components/cards/court-card.tsx src/components/cards/next-match-card.tsx
```

## Stop Criteria

Stop and ask for approval if implementation requires:

- API changes
- database changes
- Prisma changes
- repository/service/hook changes
- permission changes
- route changes
- new schedule workflow
- new confirmation behavior
- status lifecycle changes
- runtime changes
- session detail changes
- any change to scheduling semantics

## Completion Criteria

Stage 04 can be completed only when:

- `/schedule` visual refinement is done.
- `/schedule/[playDateId]` visual refinement is done.
- Existing CRUD flow is unchanged.
- Existing validation is unchanged.
- Existing permissions are unchanged.
- Existing route hierarchy is unchanged.
- Runtime is untouched.
- Protected diff is clean.
- Validation commands pass or failures are documented.
- Completion report is created.
