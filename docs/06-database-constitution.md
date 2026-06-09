# Database Constitution

Version: 2026-06-09

## Database Role

The database stores current operational truth for persistence, synchronization, crash recovery, finance aggregation, and shuttlecock inventory.

It is not an event-sourcing system.

## Current Schema Truth

Core tables:

- `play_dates`
- `play_sessions`
- `session_players`
- `runtime_courts`
- `runtime_matches`
- `session_transactions`
- `session_summaries`
- `shuttlecock_products`
- `shuttlecock_inventory`
- `shuttlecock_movements`

There is no required standalone `courts` table in the current runtime flow. Runtime courts are derived from `play_sessions.court_count` and persisted by `court_number`.

## Session Status Mapping

User-facing statuses:

- `PENDING`: waiting to start
- `ACTIVE`: live orchestration enabled
- `COMPLETED`: finished and readonly
- `CANCELLED`: readonly if present

Database mapping currently normalizes:

- `PENDING` -> `NOT_STARTED`
- `ACTIVE` -> `LIVE`
- `COMPLETED` -> `FINISHED`

Future status work must update `src/lib/session-status.ts`, repositories, UI labels, and governance together.

## Session Completion

Completing a session must be transactional.

Completion currently:

- validates court cost
- validates shuttlecock product and usage count
- checks enough shuttlecock stock
- creates session income transaction for paid slot income
- optionally creates court expense transaction based on settings
- optionally creates shuttlecock expense transaction based on settings
- always creates a `PLAY_USAGE` shuttlecock movement
- decrements inventory
- marks all players `FINISHED`
- empties runtime courts
- deletes runtime matches
- sets session status to `FINISHED`
- stores total income, expense, and profit

Important: session profit always subtracts court cost and shuttlecock usage cost, even when auto-created expense vouchers are disabled.

## Inventory Constitution

Inventory current-state table:

- `shuttlecock_inventory.quantity_ball`
- `avg_cost_per_ball`
- `avg_usage_price_per_ball`

Inventory history/source-of-truth movements:

- `IMPORT`
- `SALE`
- `PLAY_USAGE`
- `ADJUSTMENT`
- `OTHER`

All inventory changes must create a movement and update inventory in the same transaction. Do not update inventory directly without a movement.

## Finance Constitution

Finance is lightweight operational finance.

`session_transactions.session_id` is optional. Generated session completion transactions may reference a session. Manual finance transactions can exist without a session.

Manual finance transaction validation:

- `transaction_type` must be `INCOME` or `EXPENSE`
- `category` is required
- `title` is required
- `quantity` must be greater than 0
- `unit_price` and `total_amount` cannot be negative

Current manual categories exposed in UI:

- `SHUTTLECOCK` -> Cầu
- `COURT_FEE` -> Sân
- `OTHER` -> Khác

Do not transform finance into accounting ERP.

## Dashboard Constitution

Dashboard summaries are period-based business overview.

Current dashboard uses month/year filters and summarizes:

- income
- expense
- profit
- unpaid amount
- inventory pieces and value
- daily finance chart
- cost breakdown
- recent sessions
- active-session, unpaid, and low-stock alerts

Dashboard must remain overview-only and must not become live court scheduling.
