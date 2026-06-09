# Badmin System Constitution

Version: 2026-06-09
Status: Current architecture constitution
Scope: Entire repository

## Identity

Badmin is realtime badminton operational software. It exists to help an operator run casual badminton sessions quickly: create play dates, create sessions, add session players, run court orchestration, close sessions, and keep lightweight finance and shuttlecock inventory accurate.

Badmin is:

- a session-centric badminton operation platform
- a live court orchestration runtime
- a touch-first tablet/mobile management surface
- a lightweight finance and shuttlecock stock tracker
- a current-state runtime recovery system

Badmin is not:

- ERP
- tournament software
- warehouse management
- accounting ERP
- membership CRM
- global identity platform
- event-sourced or CQRS runtime

The product goal is real-world badminton operational efficiency, not theoretical architecture perfection.

## Current Navigation

The root app navigation is intentionally small:

1. Dashboard
2. Lịch chơi
3. Thu chi
4. Kho cầu
5. Cài đặt

Realtime scheduling is not root navigation. It exists only at:

`/sessions/[sessionId]/runtime`

The root route redirects to `/dashboard`. `/sessions` redirects to `/schedule`.

## Product Hierarchy

The canonical workflow is:

`Dashboard -> Lịch chơi -> Ngày chơi -> Ca chơi -> Điều phối`

The runtime belongs to a Play Session. Dashboard can summarize operation, but it must not become the live scheduling screen.

## Runtime Constitution

The protected runtime lifecycle is:

`WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> JUST_FINISHED -> WAITING`

`JUST_FINISHED` is a fairness, cooldown, fatigue, anti-repeat, and queue-continuity mechanic. It is not cosmetic UI state.

## Ownership

Zustand owns immediate live runtime behavior:

- optimistic player state
- court state
- next-match suggestions
- player replacement
- ready court cancellation
- match start/end
- cooldown transitions

The database owns durable current state:

- play dates and sessions
- session-scoped players
- runtime court snapshots by `court_number`
- runtime match snapshots
- finance transactions
- shuttlecock inventory and movements

The runtime UI must not wait for continuous database polling. Persist only after important operator actions or explicit data mutations.

## Protected Areas

Future AI models must not autonomously redesign:

- `src/lib/badminton-store.ts`
- live court lifecycle
- next-match suggestion and replacement flow
- `JUST_FINISHED` semantics
- operator-first override behavior
- tablet/mobile runtime layout
- current-state runtime persistence
- session-scoped player model

If source and docs disagree, preserve working runtime behavior and update governance before changing protected source.
