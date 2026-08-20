# Badmin System Constitution

Version: 2026-08-13
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

`WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> WAITING`

Ending a match returns players to `WAITING` immediately. `lastFinishedAt` is soft scheduling metadata only: it may explain or rank otherwise-equivalent suggestions, but it must never block manual consecutive matches or recreate a hidden cooldown.

## Ownership

Zustand owns immediate live runtime behavior:

- optimistic player state
- court state
- next-match suggestions
- attendance tags and suggestion eligibility
- effective-level balancing for mixed-gender scheduling
- player replacement
- ready court cancellation
- match start/end
- arrival, waiting, request, and last-finished fairness metadata

The database owns durable current state:

- play dates and sessions
- session-scoped players
- runtime court snapshots by `court_number`
- runtime match snapshots
- finance transactions
- shuttlecock inventory and movements

The runtime UI must not wait for continuous database polling. Persist only after important operator actions or explicit data mutations.

## Current Auto-Suggestion Constitution

Auto-suggestion is advisory and must never auto-apply.

Current source-level philosophy:

- player attendance tags determine suggestion eligibility
- `Chưa tới` is the default and is not auto-eligible
- `Đã tới` makes players available for auto-suggestion
- `Trận kế` is a one-shot request consumed only when the requested player or Couple actually starts a match
- selecting `Host` also marks the player as `Đã tới`, but Host remains an operational fallback and is avoided when enough non-host players exist
- `End-Game` excludes a player from new suggestions while preserving role, fee, match count, and Couple information
- legacy `Chấn thương` and `Về sớm` values are read as `End-Game` during migration
- a late arrival receives limited entry assistance, not compensation for all matches played before arrival; wait protection prevents earlier arrivals from being skipped repeatedly
- a Couple is a fixed partner only in its registered match format and behaves as independent players in other formats
- female players use one-lower effective level for internal balancing
- same-format matchups are preferred when level balance is acceptable
- mixed-format matchups are allowed only as practical fallbacks
- only an exact recently repeated quartet is avoided; court, ordinary partner, and ordinary opponent repetition are not scheduling constraints
- blocked auto-suggestion must explain why and must not commit an empty runtime snapshot

## Protected Areas

Future AI models must not autonomously redesign:

- `src/lib/badminton-store.ts`
- live court lifecycle
- next-match suggestion and replacement flow
- immediate post-match return and soft `lastFinishedAt` semantics
- late-arrival fairness, wait protection, `Trận kế`, `End-Game`, and Couple semantics
- operator-first override behavior
- tablet/mobile runtime layout
- current-state runtime persistence
- session-scoped player model

If source and docs disagree, preserve working runtime behavior and update governance before changing protected source.
