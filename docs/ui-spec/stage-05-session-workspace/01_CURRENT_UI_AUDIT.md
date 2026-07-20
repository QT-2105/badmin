# Current UI Audit

Status: Source audit complete

Audit date: 2026-07-15

Source code changed: No

## Audit Scope

Screen:

- `/sessions/[sessionId]`

Primary source:

- `src/components/schedule/session-detail-client.tsx`

Out of scope:

- Runtime screen
- Dashboard
- Schedule list
- Play Date detail
- Finance page
- Inventory page
- Users page
- Settings page

## Areas to Audit

1. Session page header.
2. Session status and primary actions.
3. Summary cards: time, player count, expected revenue.
4. Completion information card.
5. Court cost input.
6. Shuttlecock product selection.
7. Shuttlecock usage input.
8. Temporary/actual profit display.
9. Session notes.
10. Player creation form.
11. Player list rows.
12. Inline player edit state.
13. Player avatar upload trigger.
14. Payment status/type presentation.
15. Completed-session readonly state.
16. Navigation to Runtime.
17. Loading, empty, and error states.
18. Light mode.
19. Dark mode.
20. Desktop, laptop, tablet, and mobile.
21. Accessibility.
22. Shared component usage.
23. Hard-coded styles and duplicated primitives.

## Initial Findings Placeholder

Findings below are based on Stage 01, Stage 01.5, Stage 02, Stage 03, Stage 04, Stage 05 documentation and source review of:

- `src/app/sessions/[sessionId]/page.tsx`
- `src/components/schedule/session-detail-client.tsx`

## Route Session Workspace

Route:

- `/sessions/[sessionId]`

Route entrypoint:

- `src/app/sessions/[sessionId]/page.tsx`

Route behavior:

- Reads `sessionId` from route params.
- Calls `requirePageUser(`/sessions/${sessionId}`)`.
- Renders `AppShell`.
- Renders `SessionDetailClient sessionId={sessionId}`.

Risk:

- Route/auth behavior is correct and must stay read-only.
- Stage 05 should not edit route file unless explicitly approved.

## Current Page Layout

Current implementation:

- Uses a raw wrapper: `mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-5 md:px-6`.
- Does not use `PageShell` / `PageHeader`.
- Uses custom section surfaces with `rounded-xl border border-border bg-surface p-3 shadow-soft`.

Audit:

- Layout is operational and compact, but not yet aligned with Stage 03/04 page structure.
- `max-w-5xl` may be too narrow for the player preparation workspace on desktop.
- Page-level spacing is locally hard-coded instead of shared layout primitive spacing.

Risk:

- Low if migrated to `PageShell` and `PageHeader` without moving handlers or changing actions.

## Header

Current implementation:

- Raw `<header>` with back link, title, metadata, and action group.
- Back link goes to `/schedule/${session.playDateId}` or `/schedule`.
- Primary actions:
  - `Bắt đầu ca` when status is `PENDING` and user can operate.
  - `Hoàn tất ca` when status is `ACTIVE` and user can complete.
  - `Điều phối` always links to `/sessions/${sessionId}/runtime`.

Audit:

- Header has correct workflow intent.
- Uses custom typography and spacing instead of `PageHeader`.
- Runtime remains contextual, which is correct.
- Link/button hierarchy can be clarified, but action gating must remain identical.

Risk:

- High if action visibility, disabled rules, or runtime route changes.

## Summary

Current implementation:

- Three custom `InfoCard` cards:
  - `Thời gian`
  - `Người chơi`
  - `Thu dự kiến`
- Values derive from existing `session`, `players.length`, and `paymentTotals.expected`.

Audit:

- Summary is useful and should remain.
- `InfoCard` is a local primitive and duplicates Stage 02/03 metric/card concepts.
- The local tone helper is presentation-only and can be migrated to `StatCard` or shared `Card`.

Risk:

- Medium if migration changes displayed values or calculations.

## Player List

Current implementation:

- Player section includes:
  - payment summary line
  - inline add-player form
  - loading/error/action warnings
  - player rows as clickable `article role="button"`
  - inline edit state per player
  - empty state when no players
- Player row displays:
  - avatar
  - name
  - gender/level
  - match count
  - payable fee
  - payment badge
  - edit/delete buttons
- Clicking a row opens `PlayerQuickView`.

Audit:

- Data and workflow are appropriate.
- Row cards are touch-friendly but visually dense.
- Icon-only edit/delete buttons do not expose explicit `aria-label` in the current source.
- The row is clickable and also contains nested action buttons with `stopPropagation`; this is operationally valid but needs careful focus/keyboard QA.
- Player add form is compact, but its raw grid classes and local form classes can be standardized.

Risk:

- High if payment edit semantics or player payload changes.
- Medium if nested click/action behavior is altered.

## Finance Summary

Current implementation:

- `paymentTotals` is derived client-side from players:
  - `expected`
  - `paid`
- `playerFinance` derives:
  - cash
  - bank
  - unpaid
- Completion display uses:
  - draft completion expense
  - draft/actual/visible completion profit
- Completion confirm modal summarizes slot income, court cost, shuttlecock cost, and profit.

Audit:

- Finance summary is tightly coupled to existing operational calculations and must remain unchanged.
- UI can clarify expected vs actual profit, but must not change formulas or source values.

Risk:

- P0 if any UI refactor changes calculation expressions, paid/unpaid filters, or completion payloads.

## Shuttle Summary

Current implementation:

- Uses `useShuttlecockProductOptions()`.
- `selectedShuttlecock` is derived from selected product id.
- `selectedShuttlecockLabel` falls back to saved product name.
- `shuttlecockExpense = Number(shuttlecockPiecesUsed || 0) * selectedShuttlecock.avgUsagePricePerBall`.
- Completion form includes:
  - court cost
  - shuttlecock product select
  - shuttlecock pieces used
  - saved shuttlecock label

Audit:

- Inventory semantics are preserved in current UI.
- Selection and label fallback logic are important for reload/persistence behavior.
- The form uses raw `input/select` and shared class strings instead of `Input`/`Select`.

Risk:

- P0 if product id/name persistence or usage price calculation changes.

## Session Status

Current implementation:

- `normalizedStatus = normalizeSessionStatus(session?.status)`.
- `runtimeLocked = COMPLETED or CANCELLED`.
- `canStartSession = players.length >= courtCount * 6`.
- Permission gates:
  - `session.operate`
  - `session.complete`
- `Bắt đầu ca` disabled when not enough players.
- Completion action appears only when `ACTIVE` and completion permission exists.

Audit:

- Status and permission gates are correct protected behavior for this screen.
- Visual redesign must not make disabled states ambiguous.

Risk:

- P0 if status checks, permission checks, or minimum player eligibility change.

## Action Buttons

Current implementation:

- Uses shared `Button`.
- Some icon-only player action buttons lack accessible labels.
- Completion expand/collapse button includes text and icon.
- Confirm modal uses custom fixed overlay and shared buttons.

Audit:

- Button primitive is used, but action hierarchy can be improved.
- Destructive actions use `variant="danger"`, which is correct.
- Confirm modal is custom; replacing it with Dialog would be a behavior-adjacent UI migration and should not happen without explicit approval in Stage 05.

Risk:

- Medium for visual action migration.
- High if confirmation timing or completion flow changes.

## Empty State

Current implementation:

- Uses Stage 02 `EmptyState` for no players.
- Empty copy says players should be added before Runtime hydrates from database.

Audit:

- Empty state is already on the shared primitive.
- Copy is operationally accurate.

Risk:

- Low if kept unchanged.

## Loading

Current implementation:

- Uses `NoticeCard` for:
  - session loading
  - player loading

Audit:

- Loading conditions are simple and correct.
- Presentation is not fully aligned with Stage 02 `LoadingState`.

Risk:

- Low if condition and placement remain unchanged.

## Error

Current implementation:

- Uses `NoticeCard tone="danger"` for:
  - session error
  - player error
- Uses `NoticeCard tone="warning"` for player action error.
- Uses inline warning surface for completion validation errors.

Audit:

- Error sources are preserved.
- Could be migrated to `ErrorState` / `WarningState` only if messages remain exactly sourced from existing errors.

Risk:

- Medium if API validation messages are swallowed or reworded incorrectly.

## Responsive

Current implementation:

- Page uses max width and responsive grids.
- Completion form uses `md:grid-cols-[150px_1fr_130px_auto]`.
- Player add form uses `md:grid-cols-[minmax(220px,1.7fr)_82px_82px_180px_48px_auto]`.
- Inline edit uses responsive grid from two columns to many columns.
- Player rows switch to multi-column at `md`.

Audit:

- Layout is functional but has several fixed column widths that can feel cramped.
- Player add form and edit form need tablet/mobile QA because fixed `82px`, `48px`, and `180px` tracks can constrain labels/controls.
- Completion form can wrap but should be checked for button clipping.

Risk:

- Medium for responsive polish.
- High only if field ordering or submission behavior changes.

## Shared Components

Already used:

- `Button`
- `EmptyState`
- `StatusBadge`
- `PlayerFeeInput`
- `PlayerAvatar`
- `PlayerQuickView`

Still using older/local presentation:

- raw page wrapper instead of `PageShell`
- raw header instead of `PageHeader`
- `NoticeCard` for loading/error/warning
- `formInputClass` and `formLabelClass` raw classes
- local `InfoCard`
- raw surfaces instead of `Card` / `FormSection`
- custom completion confirm modal instead of `Dialog`

Audit:

- Shared component adoption is partial.
- Stage 05 should migrate only low-risk primitives and avoid confirmation behavior changes unless explicitly approved.

## Hard-Coded Styles

Current hard-coded style areas:

- page wrapper spacing and max width
- raw grid templates
- repeated `rounded-xl border border-border bg-surface p-3 shadow-soft`
- repeated warning/info soft surface classes
- local `InfoCard` tone helper
- fixed form heights (`h-10`, `h-11`)
- custom overlay modal structure

Audit:

- Most styles use semantic tokens, not raw hex colors.
- Inconsistency is mostly primitive duplication, density, and local grid sizing.

Risk:

- Low to medium for token/primitive migration.

## Protected Files

Stage 05 must not edit:

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/**`
- `src/lib/badminton-store.ts`
- `src/lib/auth/**`
- `src/lib/date-format.ts`
- `src/lib/session-status.ts`
- `src/lib/player-labels.ts`
- `src/types/domain.ts`
- `prisma/**`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/**`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- runtime synchronization files

### P0 - Blocking / Safety Issues

- Finance and inventory expressions live directly in the UI component. Any redesign must preserve `paymentTotals`, `draftCompletionExpense`, `draftCompletionProfit`, `actualCompletionProfit`, `visibleCompletionProfit`, and `shuttlecockExpense` exactly.
- Completion payloads for `updatePlaySession.mutateAsync` and `completePlaySession.mutateAsync` are business-critical and must not be edited during presentation migration.
- Session status and permission gates are business-critical: `normalizeSessionStatus`, `runtimeLocked`, `canStartSession`, `canOperateSession`, and `canCompleteSession` must not be changed.
- Shuttlecock product id/name fallback logic is required for correct reload display and completion persistence; do not simplify it during UI work.
- Player payment edit mapping through `getPaymentEditValue` and `withPaymentEditValue` must not change.

### P1 - Consistency / Component Issues

- Page still uses raw wrapper/header instead of `PageShell` / `PageHeader`.
- Summary cards use local `InfoCard` instead of shared `StatCard` or `Card`.
- Completion section uses repeated raw surface and form styles instead of `FormSection`, `Input`, `Select`, and `Textarea`.
- Loading/error/warning states still use `NoticeCard` rather than Stage 02 feedback primitives.
- Player add form and inline edit form use repeated local form classes and dense custom grid tracks.
- Player edit/delete icon buttons need explicit accessible labels.
- Custom completion modal is not Stage 02 `Dialog`, but migration should be deferred unless separately approved because it touches confirmation workflow presentation.

### P2 - Polish / Density Issues

- Header action group can be visually tightened after migration to `PageHeader`.
- Fixed-width grid tracks can be tuned for tablet/mobile readability.
- Completion profit badge can be visually aligned with Stage 03/04 metric tone hierarchy.
- Player row metadata can be made easier to scan without changing fields.
- Avatar upload trigger can be visually standardized with other upload controls.
- Long player names and note text need overflow review in desktop/tablet/mobile QA.

## Business Logic Risk Areas

Future UI work must not alter:

- start session behavior
- complete session behavior
- completion validation
- profit calculations
- payment calculations
- player CRUD
- avatar upload/delete behavior
- shuttlecock usage product selection persistence
- inventory movement generation
- finance transaction generation
- readonly behavior for completed sessions
- route to `/sessions/[sessionId]/runtime`

## Required Evidence Before Implementation

- Current component structure reviewed.
- Current handlers and payloads identified.
- Current permission and status gates identified.
- Current completion calculation display paths identified.
- Current player add/edit/delete paths identified.
- Protected dependency list confirmed.
- Route Session Workspace confirmed as `/sessions/[sessionId]`.
- Runtime route confirmed as contextual `/sessions/[sessionId]/runtime` link only.
