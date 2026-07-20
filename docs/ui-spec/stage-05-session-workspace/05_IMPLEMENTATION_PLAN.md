# Implementation Plan

Status: Completed - PASS WITH NOTES

Source code changed: Yes - presentation-only changes completed

Completion report: `08_COMPLETION_REPORT.md`

## Plan Rule

Do not implement Stage 05 until this plan is accepted.

Stage 05 implementation may only modify presentation in:

- `src/components/schedule/session-detail-client.tsx`

Documentation/reporting may modify:

- `docs/ui-spec/stage-05-session-workspace/08_COMPLETION_REPORT.md`
- `docs/ui-spec/PROJECT_PROGRESS.md`

No business logic, database, API, Prisma, repository, service, hook, React Query, Zustand, runtime, payment, finance, inventory, route, query parameter, CRUD, or validation behavior may change.

## Files Planned for Modification

Implementation candidate:

- `src/components/schedule/session-detail-client.tsx`

Documentation/reporting:

- `docs/ui-spec/stage-05-session-workspace/08_COMPLETION_REPORT.md`
- `docs/ui-spec/PROJECT_PROGRESS.md`

## Files to Read Only

- `src/app/sessions/[sessionId]/page.tsx`
- `src/hooks/use-session-detail.ts`
- `src/hooks/use-session-players.ts`
- `src/hooks/use-session-completion.ts`
- `src/hooks/use-inventory.ts`
- `src/hooks/use-app-settings.ts`
- `src/services/session-service.ts`
- `src/services/inventory-service.ts`
- `src/repositories/play-sessions-repository.ts`
- `src/repositories/session-players-repository.ts`
- `src/repositories/shuttlecock-inventory-repository.ts`
- `src/types/domain.ts`
- `src/lib/session-status.ts`
- `src/lib/player-labels.ts`
- `src/lib/date-format.ts`
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
- `src/lib/player-labels.ts`
- `src/types/domain.ts`
- `prisma/**`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/**`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- runtime synchronization files

## Shared Component Policy

Use existing shared components before local markup:

- `PageShell` / PageLayout
- `PageHeader`
- `StatCard`
- Summary card pattern via `StatCard` or `Surface`
- `Surface`
- `StatusBadge`
- `FormSection`
- `EmptyState`
- `LoadingState`
- `Skeleton`
- `ActionMenu` only for secondary actions if it does not hide critical controls

Do not introduce new components if these shared primitives are enough.

Avoid unless separately approved:

- `Dialog` confirmation replacement
- `Drawer`
- `DataTable` for player list
- `FilterBar`

## Logic That Must Stay Identical

- session fetch and route parameter usage
- session status lifecycle
- start session handler
- complete session handler
- update completion info handler
- court cost state and payload
- shuttlecock product state and payload
- shuttlecock usage state and payload
- note state and payload
- player add/edit/delete handlers
- player avatar upload/delete handler
- payment state and labels
- expected revenue calculation display source
- profit calculation display source
- readonly rules after completed/cancelled states
- route to `/sessions/[sessionId]/runtime`

## Task Order

1. Task 0 - Baseline
2. Task 1 - Header
3. Task 2 - Session Summary
4. Task 3 - Player List
5. Task 4 - Finance Summary
6. Task 5 - Court Summary
7. Task 6 - Shuttle Summary
8. Task 7 - Primary Actions
9. Task 8 - Responsive
10. Task 9 - Accessibility
11. Task 10 - Validation
12. Task 11 - Completion Report

Each task must be reviewable and rollbackable on its own.

## Task Summary

| Task | File sửa | Shared components | Validation | Completion criteria |
| --- | --- | --- | --- | --- |
| Task 0 - Baseline | none | none | `git status --short`, protected diff | Baseline and protected diff recorded. |
| Task 1 - Header | `session-detail-client.tsx` | `PageShell`, `PageHeader`, `Button`, `StatusBadge` | `npm run lint`, `npm run typecheck` | Header aligns with DS; routes/actions/gates unchanged. |
| Task 2 - Session Summary | `session-detail-client.tsx` | `StatCard`, `Surface` | `npm run lint`, `npm run typecheck` | Time/player/revenue values unchanged and compact. |
| Task 3 - Player List | `session-detail-client.tsx` | `Surface`, `FormSection`, `StatusBadge`, `EmptyState` | `npm run lint`, `npm run typecheck` | Add/edit/delete/quick view payloads unchanged. |
| Task 4 - Finance Summary | `session-detail-client.tsx` | `Surface`, `StatusBadge` | `npm run lint`, `npm run typecheck` | Cash/bank/unpaid formulas unchanged. |
| Task 5 - Court Summary | `session-detail-client.tsx` | `FormSection`, `Surface` | `npm run lint`, `npm run typecheck` | Court cost field/payload unchanged. |
| Task 6 - Shuttle Summary | `session-detail-client.tsx` | `FormSection`, `Surface` | `npm run lint`, `npm run typecheck` | Product/usage/fallback/calculation unchanged. |
| Task 7 - Primary Actions | `session-detail-client.tsx` | `Button`, optional `ActionMenu` for secondary only | `npm run lint`, `npm run typecheck` | Start/complete/runtime actions preserve visibility, disabled rules, and route. |
| Task 8 - Responsive | `session-detail-client.tsx` | existing primitives only | `npm run lint`, `npm run typecheck` | Desktop/tablet/mobile wrapping improved without workflow changes. |
| Task 9 - Accessibility | `session-detail-client.tsx` | `Button`, `StatusBadge`, feedback primitives | `npm run lint`, `npm run typecheck` | Labels/focus/disabled states pass review. |
| Task 10 - Validation | none unless validation fix is required | none | `npm run lint`, `npm run typecheck`, `npm run build`, `npm run guard:no-db-schema-automation` | All validation commands pass or failure is documented. |
| Task 11 - Completion Report | `08_COMPLETION_REPORT.md`, `PROJECT_PROGRESS.md` | none | protected diff | Completion report and progress updated. |

## Risk Assessment

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Accidentally changing session completion payloads while moving JSX | High | Keep handlers and payload objects unchanged; compare diff before validation. |
| Changing payment semantics while simplifying player rows | High | Preserve payment labels, state values, and update paths. |
| Changing inventory usage behavior | High | Do not touch hooks/services/repositories or calculation helpers. |
| Changing finance generation behavior | High | Do not touch completion handler logic. |
| Making Runtime navigation feel like root navigation | Medium | Keep Runtime as contextual session action only. |
| Hiding critical operator actions behind menus | Medium | Keep primary actions visible. |
| Responsive player rows clipping on tablet/mobile | Medium | Validate wrapping and touch target size. |

## Validation Commands

After implementation tasks:

```bash
npm run lint
npm run typecheck
```

Checkpoint validation:

```bash
npm run build
npm run guard:no-db-schema-automation
```

Protected diff check:

```bash
git diff -- src/app/api src/repositories src/services src/hooks prisma src/lib/badminton-store.ts src/lib/auth src/lib/date-format.ts src/lib/session-status.ts src/lib/player-labels.ts src/types/domain.ts src/components/realtime-dashboard.tsx src/components/sections src/components/cards/court-card.tsx src/components/cards/next-match-card.tsx
```

## Stop Criteria

Stop and ask for approval if implementation requires:

- API changes
- database changes
- Prisma changes
- repository/service/hook changes
- permission changes
- route changes
- new session workflow
- new payment workflow
- new completion calculation
- inventory movement changes
- finance transaction changes
- runtime changes
- Zustand changes
- replacing confirmation behavior with a new Dialog flow
- introducing a Drawer/mobile workflow
- creating a new shared component

## Completion Criteria

Stage 05 can be completed only when:

- Session Workspace visual refinement is done.
- Existing session preparation flow is unchanged.
- Existing player management flow is unchanged.
- Existing completion flow is unchanged.
- Existing payment/finance/inventory semantics are unchanged.
- Existing route hierarchy is unchanged.
- Runtime is untouched.
- Protected diff is clean.
- Validation commands pass or failures are documented.
- Completion report is created.
