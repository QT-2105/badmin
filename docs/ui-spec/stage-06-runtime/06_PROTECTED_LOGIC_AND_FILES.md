# Protected Logic And Files

Status: Required reference

## Protected Files

Do not edit without explicit Stage 06 task approval:

- `src/lib/badminton-store.ts`
- `src/hooks/use-runtime-hydration.ts`
- `src/hooks/use-runtime-sync.ts`
- `src/app/api/runtime/snapshot/**`
- `src/repositories/**`
- `src/services/**`
- `src/app/api/**`
- `prisma/**`
- finance files
- inventory files
- permission/auth files

## Runtime UI Files With Protected Behavior

The following files may receive only presentation-safe changes after audit:

- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/sections/match-history-panel.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- `src/components/cards/player-team.tsx`

## Protected Store Actions

Do not change call order, arguments, or timing for:

- `setRuntimeSessionId`
- `updateCooldowns`
- `refreshNextMatches`
- `applyNextMatch`
- `replaceNextMatchPlayer`
- `toggleNextMatchLock`
- `swapPairs`
- `startMatch`
- `endMatch`
- `cancelReadyCourt`
- `updatePlayer`
- `updatePlayerPayment`
- `commitRuntimeSnapshot`
- `createHistory.mutateAsync`
- `persistPlayer.mutateAsync`

## Protected Runtime Functions

Do not change behavior, conditions, data shape, or timing for:

- `SessionRuntimePage`
- `RuntimeRouteClient`
- `RealtimeDashboard`
- `confirmLeave`
- `refreshSuggestions`
- `recordMatchHistory`
- `RuntimeTopBar`
- `RuntimeNotice`
- `StatPill`
- `getStatPillSurfaceTone`
- `SuggestionModePicker`
- `PlayerStatusOverview`
- `getPlayerStatusLabel`
- `getPlayerStatusTone`
- `getAutoMatchBlockReason`
- `isEligibleForAutoMatchNotice`
- `LiveCourtsSection`
- `CourtCard`
- `formatTime`
- `buildMatchHistoryPayload`
- `NextMatchQueue`
- `NextMatchCard`
- `PairPreview`
- `ReplacePairColumn`
- `toQuickViewPlayer`
- `PlayerDatabasePanel`
- `markDirty`
- `saveChanges`
- `toRuntimeQuickViewPlayer`
- `getPaymentSelectValue`
- `MatchHistoryPanel`
- `TeamBox`
- `formatDateTime`
- `PlayerTeam`

Presentation-only edits may touch JSX classes, semantic wrappers, labels, ARIA labels, focus classes, and responsive classes only when these functions still receive the same data and call the same handlers in the same situations.

## Protected Concepts

- `JUST_FINISHED` is cooldown/fairness state, not cosmetic.
- Next-match suggestions are advisory.
- Operator controls are authoritative.
- Runtime DB writes happen only on meaningful operator actions.
- Courts are generated from session court count.
- Players are session-scoped.

## Stage 06 Forbidden Change List

Do not change:

1. Queue source.
2. Queue sorting.
3. Priority mapping.
4. Player runtime status.
5. Match generation.
6. Auto pairing.
7. Manual pairing.
8. Gender/level pairing criteria.
9. Court assignment.
10. Current match references.
11. Start match.
12. End match.
13. Swap pair.
14. Apply match.
15. Match history source.
16. Runtime hydration.
17. Runtime synchronization.
18. Zustand actions.
19. Query keys.
20. Mutations.
21. API payloads.
22. Repository queries.
23. Service calculations.
24. Routes.
25. Permissions.

## Out Of Scope Protocol

If a requested presentation change requires any item above:

- Do not edit the protected source.
- Mark the item `Out of Scope`.
- Record the affected file and reason.
- Stop the sprint task if safe visual-only progress is no longer possible.
