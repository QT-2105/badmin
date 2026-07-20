# Current Finance Audit

Status: Sprint 7.0 audit complete

## Route And Entry

- Route: `/finance`
- Page entry: `src/app/finance/page.tsx`
- Client component: `src/components/finance/finance-page-client.tsx`
- Shell: `AppShell`
- Auth gate: `requirePageUser('/finance')`

## Current Data Flow

```text
FinancePageClient
-> useCurrentUser
-> hasPermission(currentUser, 'finance.manage')
```

```text
FinancePageClient
-> useTransactions({ period, month, year })
-> fetchTransactions
-> GET /api/finance/transactions
-> listSessionTransactions
-> prisma.session_transactions.findMany
```

```text
FinancePageClient submit
-> createTransaction.mutateAsync(payload)
-> createTransaction service
-> POST /api/finance/transactions
-> createSessionTransaction
-> prisma.session_transactions.create
-> optional refreshSessionFinance
```

## Current UI Structure

1. Page header.
2. Report period toolbar.
3. Three KPI cards: doanh thu, chi phi, loi nhuan.
4. Conditional create transaction section based on `finance.manage`.
5. Loading/error/action feedback notices.
6. Transaction list with sort and page-size controls.
7. Horizontal scroll table-like list.
8. Pagination controls.

## Audit Coverage

### Finance Route

- `/finance` renders through `src/app/finance/page.tsx`.
- Page requires a logged-in user before rendering `FinancePageClient`.
- Route must remain unchanged in Stage 07.

### Finance Page

- `FinancePageClient` owns local presentation state for form open/closed, report period, sort, pagination, and action error.
- It also owns current client-side filtering/sorting/pagination over fetched period data.
- Stage 07 must not move these responsibilities into a different data owner.

### Page Header

- Uses shared `PageHeader`.
- Hierarchy is generally aligned but can be tightened with surrounding spacing.
- P1: description can be operationally clearer without changing meaning.

### Report Period Filters

- Current controls:
  - `reportPeriod`: `MONTH` / `YEAR`
  - `reportMonth`: `type="month"`
  - `reportYear`: numeric year input
- Data fetching uses the same values in `useTransactions`.
- P1: visual footprint and alignment can be improved.
- Protected: values, defaults, handlers, query params, and filter behavior.

### KPI Cards / Finance Summary

- Current KPI cards:
  - Doanh thu: `totals.income`
  - Chi phi: `totals.expense`
  - Loi nhuan: `totals.income - totals.expense`
- Totals come from `getFinanceTotals(reportTransactions)`.
- P1: `MetricCard` can be aligned with Stage 02 `StatCard` if value semantics remain unchanged.
- P0 risk: any accidental value or sign change is forbidden.

### Form Tao Phieu

- Conditional visibility: `finance.manage` only.
- Current fields:
  - title
  - transaction type
  - adjustment type
  - category
  - quantity
  - unit price
  - note
- Submit calls `createTransaction.mutateAsync({ transactionType, adjustmentType, category, title, quantity, unitPrice, note })`.
- P1: form grouping, alignment, and tablet layout need refinement.
- P0 risk: wrong payload, dropped field, changed validation, or changed permission visibility.

### Entry Type Selector

- Current source uses `transactionType` with `INCOME` / `EXPENSE`.
- Current source uses `adjustmentType` with `NORMAL` / `DEDUCTION`.
- UI labels map `DEDUCTION` to `Dieu chinh giam thu` or `Dieu chinh giam chi` based on transaction type.
- Protected: entry/transaction/adjustment semantics.

### Category Selector

- Current manual categories in UI:
  - `COURT_FEE` -> San
  - `SHUTTLECOCK` -> Cau
  - `SESSION_FEE` -> Slot
  - `OTHER` -> Khac
- Display helper also maps `SHUTTLECOCK_USAGE` to Cau.
- Stage 07 must preserve category values and mapping.
- Safety contract also reserves canonical finance categories named by the owner, including shuttle sale/consumption and extra court categories.

### Quantity / Unit Price / Total Amount

- Form captures `quantity` and `unitPrice`.
- Repository computes `totalAmount` as `quantity * unitPrice` when not explicitly provided.
- P0: formula and numeric values must not change.

### Payment Method / Payment Status

- Finance page currently does not expose payment method or payment status controls.
- These values are protected because they affect session/player finance elsewhere.
- Stage 07 must not introduce or reinterpret payment method/status in this module.

### Session Relation

- API and repository support optional `sessionId`.
- Manual finance form currently does not select a session.
- Generated completion transactions may reference a session outside this page.
- Stage 07 must not change optional session relation behavior.

### Transaction List

- Current list uses a custom grid with columns:
  - Loai
  - Noi dung
  - SL x Don gia
  - So tien
  - Thoi gian
- Current list is scoped to selected report period, sorted client-side, paginated client-side.
- P0: custom grid lacks true table semantics for financial records.
- P1: readability, numeric alignment, row density, and overflow can improve.

### Transaction Actions

- Current list is read-only and has no row edit/delete/detail action.
- Stage 07 must not add new transaction actions.
- Sprint 7.5 should be no-op unless existing actions appear before implementation.

### Empty State

- Uses `EmptyState` inside transaction list when `visibleTransactions.length === 0`.
- P2: copy and placement can be polished.
- Protected: empty condition.

### Loading State

- Uses `NoticeCard` when `isLoading`.
- P1: loading can be better aligned with shared feedback states.
- Protected: loading condition.

### Error State

- Uses `NoticeCard tone="danger"` for query error.
- Uses `NoticeCard tone="warning"` for action error.
- P1: placement and contrast can improve.
- Protected: error source and message semantics.

### Light Mode / Dark Mode

- Component mostly uses semantic tokens through shared classes.
- P0: deduction/status badge contrast must be verified in light mode.
- P1: custom grid/table surfaces need light/dark parity.

### Desktop / Tablet / Mobile

- Desktop: current layout is usable but can be more consistent.
- Tablet landscape: form columns may feel cramped.
- Tablet portrait: list and form need careful bounded overflow.
- Mobile: list relies on horizontal scroll; global page overflow must be avoided.
- P0: tablet/mobile overflow that hides finance actions would be unacceptable.

### Accessibility

- Current form uses visible labels.
- Custom grid list is not an accessible table.
- P0: transaction list semantics/focus/contrast require attention.
- P1: filters and pagination need consistent accessible names/focus.

### Hard-Coded Styles

- Finance page uses layout utility strings directly for grids, widths, spacing, sticky header, and row colors.
- P1: migrate repeated presentation to shared primitives where safe.
- Protected: no state, handler, or data mapping changes.

### Shared Components

Already used:

- `Button`
- `Input`
- `Select`
- `EmptyState`
- `MetricCard`
- `NoticeCard`
- `PageHeader`
- `PageShell`
- `SectionCard`
- `ToolbarCard`
- `PaginationControls`
- `StatusBadge`

Recommended adoption candidates:

- `FilterBar`
- `StatCard`
- `DataTable`
- `FormSection`
- `LoadingState`
- `ErrorState`

### Finance Dependencies

- `src/hooks/use-finance.ts`
- `src/services/finance-service.ts`
- `src/repositories/finance-repository.ts`
- `src/app/api/finance/transactions/route.ts`
- `src/lib/finance-calculation.ts`
- `src/types/domain.ts`

All are protected/read-only for Stage 07 implementation unless explicit approval is given.

## Existing Shared Components

Already used:

- `Button`
- `Input`
- `Select`
- `EmptyState`
- `MetricCard`
- `NoticeCard`
- `PageHeader`
- `PageShell`
- `SectionCard`
- `ToolbarCard`
- `PaginationControls`
- `StatusBadge`

Potential Stage 02 adoption:

- `FilterBar`
- `StatCard`
- `DataTable`
- `FormSection`
- `ActionMenu` if detail actions exist later, but no new action should be added in Stage 07
- `LoadingState`
- `ErrorState`

## P0 Findings

- Any UI migration that changes displayed values, sign handling, period filtering, sort order, or submit payload would be a P0 regression.
- Manual form has P0 sensitivity because it can create financial records; all fields and payload keys must remain unchanged.
- Finance list uses table-like custom grid instead of the shared `DataTable`; accessibility semantics are weaker than desired for financial records.
- Current amount/status colors need strict light/dark contrast validation, especially deduction rows and transaction badges.
- Error/loading/action feedback uses mixed presentation; it should remain visible without moving core controls.
- Tablet/mobile overflow must not hide finance filters, form submit, or transaction audit data.

## P1 Findings

- KPI cards use `MetricCard`, while newer stages prefer `StatCard` for consistency.
- Report-period filter is custom `ToolbarCard`; it should visually align with Stage 03 Dashboard and Stage 08 Inventory later.
- Create transaction form is dense but has uneven column sizing on tablet.
- Manual form labels and input widths can be normalized without changing field behavior.
- The transaction list has column headers but row density, numeric alignment, and mobile overflow need refinement.

## P2 Findings

- Hover states and selected/focus treatment can be polished.
- Motion should remain minimal and operational.
- Empty state copy can be clearer while preserving meaning.
- Minor typography hierarchy improvements are available for the transaction title/note/date.

## Protected Logic Observed

- `getFinanceTotals` computes income/expense from signed totals.
- `getSignedAmount` treats `DEDUCTION` as negative.
- API GET accepts `period`, `month`, `year`, and optional `sessionId`.
- API POST sends `sessionId`, `transactionType`, `adjustmentType`, `category`, `title`, `quantity`, `unitPrice`, `totalAmount`, and `note`.
- `useFinanceMutations` invalidates finance transactions, dashboard summary, and schedule.

## Risk Summary

The highest risk is accidentally changing submit payload, filter/query behavior, or signed amount display while migrating UI components. Stage 07 must keep all state and handlers intact unless explicitly approved.
