# Implementation Gap Report

Date: 2026-06-09
Scope: Current source compared against updated `AGENTS.md`, `/docs/*`, `/rules/*`, and `/prompts/*`

## Current Implementation Status

Badmin currently implements the governed route hierarchy:

`Dashboard -> Lịch chơi -> Ngày chơi -> Ca chơi -> Điều phối`

Implemented routes:

- `/dashboard`
- `/schedule`
- `/schedule/[playDateId]`
- `/sessions/[sessionId]`
- `/sessions/[sessionId]/runtime`
- `/finance`
- `/inventory`
- `/settings`

Root `/` redirects to `/dashboard`. `/sessions` redirects to `/schedule`. Runtime is not root navigation.

## Completed Current Modules

### Governance

- `AGENTS.md`
- `/docs/*`
- `/rules/*`
- `/prompts/*`

### App Shell

- fixed desktop/tablet sidebar
- collapsed state stored in `localStorage`
- mobile sticky top nav
- root nav: Dashboard, Lịch chơi, Thu chi, Kho cầu, Cài đặt
- no global Điều phối navigation

### Dashboard

- period filter by month/year, default current month
- revenue, expense, profit, unpaid, inventory value
- daily finance chart
- cost breakdown
- recent sessions
- active-session/unpaid/low-stock alerts

Dashboard is business overview only.

### Schedule

- DB-backed play date list/create/delete
- title auto-generation when blank: `Thứ ... | YYYY-MM-DD`
- duplicate play-date validation
- no past-date creation
- play dates sorted newest first
- delete play date only when not past and no sessions exist

### Play Date Detail

- DB-backed session list/create/edit/delete
- sessions sorted by earliest start time
- max court count follows browser-local settings
- past dates are review-first
- structural session edit/delete only while session is pending and date is not past

### Session Detail

- DB-backed session players
- inline player edit
- start session validates `court_count * 6` players
- completion card stores court cost, shuttlecock product, shuttlecock pieces used, and profit
- completion validates required fields
- completion confirmation controls session closure
- completed/cancelled sessions lock runtime/player editing

### Runtime

- canonical route: `/sessions/[sessionId]/runtime`
- sticky runtime top bar with return paths
- compact stats header
- single `QUẢN LÝ SÂN` area for courts and suggestions
- no standalone dead Hàng chờ tab
- full-screen player list from `Người chơi`
- Zustand optimistic runtime
- explicit snapshot commit on important operator actions
- courts generated from `play_sessions.court_count`
- runtime persistence uses `court_number`
- next-match suggestions prevent duplicates
- replacement excludes `PLAYING` players
- ready court can be cancelled before start
- match end moves players to `JUST_FINISHED`

### Finance

- DB-backed transaction list/create
- manual vouchers do not require session selection
- title validation
- manual categories: Cầu, Sân, Khác
- period filter by month/year, default current month
- list sort: newest/oldest only

### Inventory

- DB-backed shuttlecock product list/create/edit/delete
- stock shown in tubes/balls and total balls
- product form collapsible
- import/outbound forms hidden behind tab-like controls
- movement history list
- movement-driven stock updates
- no negative stock
- weighted average cost/usage price logic in repository

### Settings

- browser-local settings:
  - auto-create court fee transaction
  - auto-create shuttlecock usage transaction
  - max court count per session

## Current Runtime Gaps To Treat Carefully

- `justFinishedAt`, fatigue, and rest timing are mostly local runtime concerns and are not fully persisted as dedicated DB fields.
- Runtime sync is explicit and non-blocking; failed sync does not block live operation.
- Runtime player payment edits must remain compatible with non-blocking operator flow.
- `CANCELLED` is normalized in app code but database status persistence currently maps the primary flow to `NOT_STARTED`, `LIVE`, and `FINISHED`.

These are not reasons to redesign runtime architecture.

## Potential Future Work

- add transaction edit/delete if operationally needed
- add shared settings persistence if multiple devices need same preferences
- refine runtime recovery conflict handling
- add tests for session completion and inventory movement formulas
- add tests for duplicate-free next-match replacement

## Protected Areas Not To Rewrite

- `src/lib/badminton-store.ts`
- player lifecycle
- `JUST_FINISHED`
- next-match scoring/replacement
- court lifecycle
- runtime tablet/mobile UX
- explicit DB commit strategy
- session completion finance/inventory transaction
- shuttlecock movement model
