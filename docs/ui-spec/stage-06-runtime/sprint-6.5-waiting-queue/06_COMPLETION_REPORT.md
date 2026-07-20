# Completion Report

Status: Complete.

## Scope

Sprint 6.5 refined the Runtime waiting queue presentation only:

- queue section hierarchy;
- player row/card density;
- name, gender, level, tag and status presentation;
- status age presentation from existing `statusUpdatedAt`;
- scroll area;
- empty state;
- badges;
- hover/focus/touch affordance;
- dark shell contrast.

## Files Changed

- `src/components/realtime-dashboard.tsx`
- `docs/ui-spec/stage-06-runtime/sprint-6.5-waiting-queue/02_ALLOWED_FILES.md`
- `docs/ui-spec/stage-06-runtime/sprint-6.5-waiting-queue/05_ACCEPTANCE_CHECKLIST.md`
- `docs/ui-spec/stage-06-runtime/sprint-6.5-waiting-queue/06_COMPLETION_REPORT.md`

## Preserved Runtime Contract

- Queue input source unchanged: `players` from Zustand store.
- Queue sorting code unchanged: `sortedPlayers` uses the existing `statusRank`, `matchesPlayed`, and Vietnamese name comparison.
- No sort, `orderBy`, filter, mutation, clone-and-reorder, or player removal behavior was added.
- `runtime_status` values unchanged.
- Player selection, multi-select/manual pairing callbacks, and runtime actions unchanged.
- Zustand actions unchanged.
- API calls unchanged.
- Status updates unchanged.

## Out of Scope

The requested canonical display order says:

`PRIORITY / WAITING -> JUST_FINISHED -> PLAYING -> RESTING`

The current source ranks `PRIORITY` after `PLAYING` inside `PlayerStatusOverview`. Sprint 6.5 is presentation-only and explicitly forbids queue sorting changes, so this was not changed. If the owner wants `PRIORITY` moved before `WAITING`, that must be handled as a separate runtime behavior task with explicit approval.

## UI Changes

- Queue header now has clearer title hierarchy and total player badge.
- Tag summary badges have stronger contrast and consistent pill sizing.
- Expand/collapse control has larger tablet touch target and focus ring.
- Expanded list uses denser two-column cards with bounded scroll.
- Player name, gender, level, tag, match count, and status are easier to scan.
- Status age is displayed from existing `statusUpdatedAt` without adding polling or state mutation.
- Empty state uses a clearer dashed surface.

## Validation

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run guard:no-db-schema-automation`: PASS

## Protected Areas

No changes were made to:

- `src/lib/badminton-store.ts`
- runtime hooks
- runtime API
- repositories
- services
- Prisma/database files
- queue sorting logic
- pairing logic
- court assignment
- status update actions
- finance, inventory, or permission logic

## Deferred Issues

- Real tablet landscape/portrait screenshot QA remains deferred.
- Runtime light-mode shell is not redesigned in this sprint.
- Any change to priority queue order is explicitly deferred because it is runtime behavior, not presentation.

Final decision: PASS WITH NOTES
