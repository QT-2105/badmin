# Protected Files

All source files are protected in Sprint 6.0. Runtime source may be read but not modified.

## Absolute Protected Areas

- `src/lib/badminton-store.ts`
- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/**`
- `prisma/**`
- route files and route segment names
- permission/auth logic
- finance calculation logic
- inventory calculation logic

## Runtime Source Protected In Sprint 6.0

- `src/app/sessions/[sessionId]/runtime/page.tsx`
- `src/components/runtime-route-client.tsx`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/cards/next-match-card.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/sections/match-history-panel.tsx`
- `src/components/cards/player-team.tsx`

## Protected Runtime Contract

The Sprint 6.0 audit confirms that later Stage 06 presentation work must not change:

- queue source, queue sorting, or priority mapping
- player runtime status or court status semantics
- match generation, auto pairing, manual pairing, or gender/level criteria
- court assignment, current match references, start/end match, swap pair, apply match
- match history source, runtime hydration, runtime synchronization
- Zustand actions, query keys, mutations, API payloads
- repository queries, service calculations, routes, permissions

## Protected Functions

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

## Protected Actions And Mutations

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
