# Database Integration Audit

Date: 2026-06-09
Scope: Current Prisma schema, repositories, API routes, and DB-backed operational flows

## Summary

The current database integration matches the updated governance direction:

- session-centric play dates and play sessions
- session-scoped players
- current-state runtime persistence
- runtime courts by `court_number`
- lightweight finance
- shuttlecock product/inventory/movement model

No standalone `courts` table is required for the current runtime flow.

## Prisma Models

Current core models:

- `play_dates`
- `play_sessions`
- `session_players`
- `runtime_courts`
- `runtime_matches`
- `match_histories`
- `match_history_players`
- `session_transactions`
- `session_summaries`
- `shuttlecock_products`
- `shuttlecock_inventory`
- `shuttlecock_movements`

## Status Mapping

Application-facing statuses:

- `PENDING`
- `ACTIVE`
- `COMPLETED`
- `CANCELLED`

Current DB status mapping:

- `PENDING` -> `NOT_STARTED`
- `ACTIVE` -> `LIVE`
- `COMPLETED` -> `FINISHED`

Future persisted `CANCELLED` support requires deliberate schema/constraint work.

## Schedule Mapping

`play_dates`

- unique `play_date`
- auto-title when blank
- no duplicate play dates
- no creating in the past
- deletion blocked if date is past or sessions exist

`play_sessions`

- belongs to one play date
- stores name, start/end time, court count, status, note
- stores completion fields: court cost, shuttlecock pieces, shuttlecock product id/name
- stores aggregates: total income, expense, profit
- structural edit/delete only while pending and not past
- start requires `court_count * 6` players

## Runtime Mapping

Runtime snapshot read includes:

- session metadata
- session players
- runtime courts
- runtime matches

If no runtime court rows exist, repositories derive empty runtime courts from `play_sessions.court_count`.

Runtime snapshot write updates:

- `session_players.runtime_status`
- `session_players.total_matches`
- `session_players.last_court_number`
- queued `runtime_matches`
- court-bound `runtime_matches`
- `runtime_courts`

Runtime writes are current-state updates, not event sourcing.

## Match History Mapping

Match history is post-match lookup data.

Current tables:

- `match_histories`
- `match_history_players`

Current behavior:

- created when the operator ends a playing match
- stores court number/name, started/ended timestamps, duration, and team rosters
- stores player join rows so the UI can filter history by session player
- does not drive live runtime state
- does not replace `runtime_courts` or `runtime_matches`

## Session Player Mapping

Mapped fields:

- `full_name`
- `gender`
- `level`
- `total_matches`
- `payment_amount`
- `discount`
- `payment_method`
- `payment_status`
- `runtime_status`
- `last_court_number`
- `note`
- `joined_at`

Players remain session-scoped.

## Session Completion Mapping

Completion transaction does the following inside a Prisma transaction:

- validates court cost
- validates shuttlecock product
- validates shuttlecock usage count
- checks stock is sufficient
- calculates paid slot income
- creates slot income transaction
- optionally creates court fee expense transaction
- optionally creates shuttlecock usage expense transaction
- always creates `PLAY_USAGE` shuttlecock movement
- decrements shuttlecock inventory
- marks session players `FINISHED`
- empties runtime courts
- deletes runtime matches
- updates session status to `FINISHED`
- saves total income, expense, and profit
- upserts/updates session summary

Important: total expense and profit always include court cost and shuttlecock usage cost even if automatic expense vouchers are disabled in settings.

## Finance Mapping

`session_transactions.session_id` is nullable.

Manual finance creation:

- does not require selecting a session
- requires title
- uses transaction type `INCOME` or `EXPENSE`
- uses category
- validates quantity and non-negative price/total

Dashboard and finance pages query transactions by month/year period.

## Inventory Mapping

Inventory uses:

- `shuttlecock_products`: catalog
- `shuttlecock_inventory`: current stock and weighted average prices
- `shuttlecock_movements`: immutable movement history

Movement types:

- `IMPORT`
- `SALE`
- `PLAY_USAGE`
- `ADJUSTMENT`
- `OTHER`

Rules:

- all stock changes happen in a transaction
- all stock changes create movement
- no negative stock
- imports recalculate weighted average cost and usage price
- outbound movements keep average values unchanged
- product `balls_per_tube` cannot change after stock/history exists
- product deletion is blocked when movements exist

## API Coverage

Current APIs:

- `/api/dashboard/summary`
- `/api/play-dates`
- `/api/play-dates/[id]`
- `/api/play-dates/[id]/sessions`
- `/api/sessions/[sessionId]`
- `/api/sessions/[sessionId]/players`
- `/api/sessions/[sessionId]/complete`
- `/api/sessions/[sessionId]/match-history`
- `/api/session-players/[playerId]`
- `/api/finance/transactions`
- `/api/inventory/products`
- `/api/inventory/products/[productId]`
- `/api/inventory/movements`
- `/api/runtime/snapshot`

There are no current `/api/runtime/waiting-queue`, `/api/runtime/courts`, or `/api/runtime/matches` routes.

## Governance Risk Notes

- Do not reintroduce DB-backed continuous runtime polling/writes.
- Do not reintroduce required `courts` catalog dependency for the current runtime.
- Do not require `session_id` on manual finance transactions.
- Do not update inventory without a movement.
- Do not add global player tables as replacement for `session_players`.
