# Current Audit

Status: Complete

## Current Feedback Sources

- Loading source: `useTransactions(...).isLoading`.
- Error source: `useTransactions(...).error`.
- Retry source: React Query `refetch` returned by the existing transaction query.
- Empty source: `visibleTransactions.length === 0` through the shared `DataTable`.
- Action error source: local `actionError` set by the existing submit flow.
- Success source: local UI feedback after the existing `createTransaction.mutateAsync` succeeds.

## Current Reporting Sources

- Report period state remains `reportPeriod`, `reportMonth`, and `reportYear`.
- Transaction data still comes from `useTransactions({ period, month, year })`.
- Local report filtering still uses `isInReportPeriod`.
- Summary totals still come from `getFinanceTotals(reportTransactions)`.
- Profit still derives from `totals.income - totals.expense`.
- Transaction list still uses `sortedTransactions` and `visibleTransactions`.

## Findings

- Loading, empty, and error states can be represented inside `DataTable` without changing data or query behavior.
- The empty state should communicate "no data in the selected report period" because the Finance page is always period-scoped.
- Raw technical load errors should not be shown directly to operators.
- The existing React Query `refetch` is available for retry without changing query keys or fetch behavior.
- Manual transaction submit can show success feedback after the existing mutation resolves without changing payload or mutation behavior.

## Risks

- Feedback changes must not obscure create/list controls.
- Retry UI must call the existing query refetch only; it must not introduce a new query key or service call.
- Success feedback must not imply different persistence behavior.
- Action error copy may be mapped for operator readability, but validation and mutation semantics must remain unchanged.
