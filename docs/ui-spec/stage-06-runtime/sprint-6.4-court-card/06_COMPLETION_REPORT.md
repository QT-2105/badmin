# Completion Report

Status: Complete.

## Scope

Sprint 6.4 refined Court Card presentation only:

- court name and status badge readability;
- court surface hierarchy;
- team/player typography;
- player slot spacing and focus state;
- empty court presentation;
- action button hierarchy, hover, focus, disabled contrast, and touch target sizing.

## Files Changed

- `src/components/cards/court-card.tsx`
- `src/components/cards/player-team.tsx`
- `docs/ui-spec/stage-06-runtime/sprint-6.4-court-card/05_ACCEPTANCE_CHECKLIST.md`
- `docs/ui-spec/stage-06-runtime/sprint-6.4-court-card/06_COMPLETION_REPORT.md`

## Preserved Action Contract

| Action | Handler | Arguments | Visibility condition | Disabled condition | Preservation result |
|---|---|---|---|---|---|
| Swap pairs | `swapPairs`; then `onCommitRuntime?.()` | `court.id` | `court.status === 'READY' && court.slots.every((s) => s !== null) && !schedulingDisabled` | Not rendered when scheduling is disabled | Preserved |
| Assign next match | `applyNextMatch`; then `onCommitRuntime?.()` | `nextMatches[0].id`, `court.id` | `court.status === 'EMPTY'` | `!canAutoAssign` | Preserved |
| Cancel ready court | `cancelReadyCourt`; then `onCommitRuntime?.()` | `court.id` | `court.status === 'READY'` | `schedulingDisabled` | Preserved |
| Start match | `startMatch`; then `onCommitRuntime?.()` | `court.id` | `court.status === 'READY'` | `!canStart` | Preserved |
| End match | `buildMatchHistoryPayload`, `endMatch`, async commit/history | `court.id`, `historyPayload` | `court.status === 'PLAYING'` | `schedulingDisabled` | Preserved |

## State Review

- `EMPTY`: improved empty surface and assign button presentation; handler and disabled guard unchanged.
- `READY`: improved team layout, swap affordance, cancel/start button hierarchy; handlers unchanged.
- `PLAYING`: improved active badge, timer, end button hierarchy; match history call order unchanged.
- `FINISHED`: not currently represented by Court Card status config; out of scope because adding a state would change runtime semantics.
- Missing optional player data: existing fallback avatar/name path preserved.
- Long player names: player rows now clamp to two lines inside fixed slots.
- Disabled buttons: visual contrast improved without changing disabled conditions.
- Light/Dark: presentation uses stronger contrast classes while staying compatible with the existing runtime dark shell.
- Tablet touch: court action buttons are `min-h-11`; swap control is `h-10 w-10`.

## Protected Areas

No changes were made to:

- `src/lib/badminton-store.ts`
- runtime hooks
- runtime API
- repositories
- services
- Prisma/database files
- queue sorting
- match generation
- court assignment
- runtime persistence or synchronization

## Validation

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run guard:no-db-schema-automation`: PASS

## Deferred Issues

- Device screenshot QA for real tablet landscape and portrait remains deferred.
- Runtime light-mode shell is not redesigned in this sprint.
- `FINISHED` court presentation is out of scope unless the runtime domain adds that status explicitly.

Final decision: PASS WITH NOTES
