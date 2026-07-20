# Component Dependency Graph

Status: Sprint 6.0 graph captured

Source code changed: No

## Route To Runtime

```text
/sessions/[sessionId]/runtime
└─ SessionRuntimePage
   ├─ requirePageUser(`/sessions/${sessionId}/runtime`)
   └─ RuntimeRouteClient(sessionId)
      ├─ localStorage.setItem('badmin_active_session_id', sessionId)
      ├─ useBadmintonStore.setRuntimeSessionId(sessionId)
      └─ RealtimeDashboard
```

Protected graph rule:

- route, guard, localStorage key, and `setRuntimeSessionId` timing must not change.

## Required User Graphs

```text
Runtime Page
→ Runtime Layout
→ Court Grid
→ Court Card
→ Runtime handlers/store
```

```text
Runtime Page
→ Waiting Queue
→ Existing sorted queue data
```

```text
Runtime Page
→ Next Match
→ Existing pairing state/actions
```

```text
Runtime Page
→ Match History
→ Existing runtime match data
```

## Runtime Layout Tree

```text
RealtimeDashboard
├─ RuntimeTopBar
│  ├─ Dashboard link with onLeave confirmation
│  ├─ FullscreenToggle
│  └─ Session detail link with onLeave confirmation
├─ Runtime summary
│  └─ StatPill
├─ Runtime notices
│  └─ RuntimeNotice
├─ Runtime toolbar
│  ├─ History button
│  ├─ Player fullscreen button
│  ├─ SuggestionModePicker
│  └─ Auto xếp cặp button → refreshSuggestions
├─ Court Grid
│  └─ LiveCourtsSection
│     └─ CourtCard
│        ├─ PlayerTeam
│        ├─ swapPairs
│        ├─ applyNextMatch
│        ├─ cancelReadyCourt
│        ├─ startMatch
│        ├─ endMatch
│        └─ buildMatchHistoryPayload
├─ Waiting Queue
│  └─ PlayerStatusOverview
│     └─ existing players sorted by current local status/match/name order
├─ Next Match
│  └─ NextMatchQueue
│     └─ NextMatchCard
│        ├─ PairPreview
│        ├─ ReplacePairColumn
│        ├─ toggleNextMatchLock
│        ├─ applyNextMatch
│        └─ replaceNextMatchPlayer
├─ Player database/list panel
│  └─ PlayerDatabasePanel
│     ├─ PlayerAvatar
│     ├─ PlayerFeeInput
│     ├─ PlayerQuickView
│     ├─ updatePlayer
│     ├─ updatePlayerPayment
│     └─ persistPlayer.mutateAsync
└─ Match History
   └─ MatchHistoryPanel
      └─ useMatchHistory(sessionId, selectedPlayerId || null)
```

## Store Dependency Graph

```text
useBadmintonStore
├─ state
│  ├─ players
│  ├─ courts
│  ├─ nextMatches
│  ├─ session
│  ├─ suggestionMode
│  └─ runtimeSessionId
└─ actions
   ├─ setRuntimeSessionId
   ├─ updateCooldowns
   ├─ refreshNextMatches
   ├─ applyNextMatch
   ├─ replaceNextMatchPlayer
   ├─ toggleNextMatchLock
   ├─ swapPairs
   ├─ startMatch
   ├─ endMatch
   ├─ cancelReadyCourt
   ├─ updatePlayer
   └─ updatePlayerPayment
```

## Data/Persistence Dependency Graph

```text
RealtimeDashboard
├─ useRuntimeHydration({ sessionId, enabled })
├─ useRuntimeSync({ enabled })
│  └─ commitRuntimeSnapshot
├─ usePlaySession(runtimeSessionId)
├─ useMatchHistoryMutations(runtimeSessionId)
│  └─ createHistory.mutateAsync
└─ useSessionPlayerMutations(runtimeSessionId) through PlayerDatabasePanel
   └─ persistPlayer.mutateAsync
```

## Match History Graph

```text
CourtCard.endMatch click
├─ buildMatchHistoryPayload()
├─ endMatch(court.id)
├─ onCommitRuntime()
└─ onRecordMatch(historyPayload)
   └─ createHistory.mutateAsync(payload)
```

Protected rule:

- match history is append/display lookup only; it must not drive live court state.

## Design System Dependencies

Currently used:

- `Button`
- `FullscreenToggle`
- `PlayerAvatar`
- `PlayerFeeInput`
- `PlayerQuickView`
- `PlayerTagBadges`

Potential safe adoption:

- `Surface`
- `StatusBadge`
- `LoadingState`
- `EmptyState`

High-risk adoption:

- `Dialog`
- `Drawer`
- `DataTable`
- `ActionMenu`

These require explicit task-level justification because overlay, scroll, table, or menu substitutions may affect runtime operation.
