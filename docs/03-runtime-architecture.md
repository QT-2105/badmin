# Runtime Architecture

Version: 2026-06-09

## Runtime Model

Badmin uses current-state runtime architecture.

The database stores the latest operational snapshot needed for recovery. It does not store an event-sourced timeline of every runtime action.

## Runtime Entry

The canonical runtime screen is:

`src/app/sessions/[sessionId]/runtime/page.tsx`

It renders:

- `src/components/runtime-route-client.tsx`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`

## Runtime Hydration

Hydration flow:

1. route receives `sessionId`
2. runtime stores `badmin_active_session_id`
3. `useRuntimeHydration` loads `/api/runtime/snapshot?sessionId=...`
4. repositories load session metadata, session players, runtime courts, and runtime matches
5. if no runtime court rows exist, courts are generated from `play_sessions.court_count`
6. `hydrateRuntimeSnapshot` maps DB state into Zustand

## Runtime Sync

Runtime sync is explicit and action-driven.

Important operator actions call `commitRuntimeSnapshot`, including:

- refresh next-match suggestions
- apply next match
- replace suggestion player
- start match
- end match
- cancel ready court
- player runtime edits that need persistence

The system should avoid constant DB writes, polling, or select loops while the operator is arranging players.

## Runtime State Shape

Zustand owns:

- `players`
- `courts`
- `nextMatches`
- `history`
- `session`
- `runtimeSessionId`

Persistence owns:

- `session_players.runtime_status`
- `session_players.total_matches`
- `session_players.last_court_number`
- `runtime_courts.status`
- `runtime_courts.runtime_match_id`
- `runtime_courts.started_at`
- queued and court-bound `runtime_matches`

## Recovery

The runtime should survive refresh, tab close, and browser reopen by hydrating the current database snapshot. Recovery must not require replaying events.
