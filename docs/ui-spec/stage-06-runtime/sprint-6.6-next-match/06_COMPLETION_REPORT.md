# Completion Report

Status: Complete.

## Scope

Sprint 6.6 refined next-match presentation only:

- section layout and scroll surface;
- suggestion card hierarchy;
- Team A/Team B presentation;
- player slot and empty slot appearance;
- selected/replacement slot visibility;
- apply/lock/replace button hierarchy;
- replacement candidate list readability;
- empty and disabled states;
- hover/focus/touch affordance.

## Files Changed

- `src/components/sections/next-match-queue.tsx`
- `src/components/cards/next-match-card.tsx`
- `docs/ui-spec/stage-06-runtime/sprint-6.6-next-match/05_ACCEPTANCE_CHECKLIST.md`
- `docs/ui-spec/stage-06-runtime/sprint-6.6-next-match/06_COMPLETION_REPORT.md`

## Action Contract

| Action | Existing handler | Existing arguments | Existing data source | Preserved |
|---|---|---|---|---|
| Auto pair refresh | `refreshNextMatches`; then `onCommitRuntime?.()` | none | Zustand `refreshNextMatches`, `schedulingDisabled` | Yes |
| Assign first suggestion to empty court | `applyNextMatch`; then `onCommitRuntime?.()` | `nextMatches[0].id` | `nextMatches`, `emptyCourts`, `canAutoAssign` | Yes |
| Lock/unlock suggestion | `toggleNextMatchLock`; then `onCommitRuntime?.()` | `match.id` | `match.locked` | Yes |
| Apply suggestion to target court | `applyNextMatch`; then `onCommitRuntime?.()` | `match.id`, `targetCourt?.id` | `emptyCourts[0]`, `canApply` | Yes |
| Open/close replacement UI | `onReplaceOpenChange?.(!replaceOpen)` | boolean | `replaceOpen` prop/state | Yes |
| Select replacement slot | `setSelectedSlot` | `slot` | `draftRoster`, `slots` | Yes |
| Select replacement player | `setDraftRoster`, `setPendingReplacements`, `setSelectedSlot(null)` | selected slot, `wp.id` | `replacementPlayers` | Yes |
| Save replacements | `replaceNextMatchPlayer`; close panel; reset local state; `onCommitRuntime?.()` | `match.id`, `slotIndex`, `playerId` | `pendingReplacements` | Yes |
| Quick view player | `setQuickViewPlayer` | `toQuickViewPlayer(player)` | player in displayed pair | Yes |

## Preserved Runtime Contract

- Auto pairing unchanged.
- Manual replacement flow unchanged.
- Pair generation unchanged.
- Gender and level criteria unchanged.
- Selected player IDs unchanged.
- Selected court behavior unchanged.
- Court assignment unchanged.
- Apply payload and arguments unchanged.
- Team arrays unchanged.
- Store actions unchanged.
- API and repository unchanged.
- No new pairing mode was added.
- Existing pairing mode meaning was unchanged.

## UI Changes

- Next-match header now includes suggestion count and clearer refresh affordance.
- Suggestion list has bounded overscroll and clearer empty state.
- Suggestion card surface, title hierarchy, target court label and score pill are clearer.
- Team pair panels have stronger contrast, fixed slot density and focus rings.
- Replacement panel uses clearer side-by-side sections and candidate cards.
- Empty replacement list has a visible empty state.
- Apply, lock and replace actions now have stronger hover/focus/disabled states.

## Validation

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run guard:no-db-schema-automation`: PASS

## Protected Areas

No changes were made to:

- `src/lib/badminton-store.ts`
- pairing helpers
- useMemo/useEffect related to pairing
- apply payloads
- team/player ID data mapping
- runtime hooks
- runtime API
- repositories
- services
- Prisma/database files
- finance, inventory, or permission logic

## Deferred Issues

- Real tablet landscape/portrait screenshot QA remains deferred.
- Runtime light-mode shell is not redesigned in this sprint.
- Collision handling for long replacement candidate lists remains presentation-only and may need visual QA on small tablets.

Final decision: PASS WITH NOTES
