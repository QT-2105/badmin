# Sprint 11.13E — Finance Presentation Refactor Baseline

## Status

BASELINE COMPLETED

## Line Count Baseline

Command:

```bash
wc -l src/components/finance/finance-page-client.tsx
```

Result:

- `src/components/finance/finance-page-client.tsx`: 446 lines

## Function Map

| Function / block | Current responsibility | Refactor decision |
| --- | --- | --- |
| `FinancePageClient` | Auth permission lookup, finance mutation hook, transaction query hook, report-period state, sort state, pagination state, create-form state, feedback state, derived report transactions, totals/profit, submit validation, mutation payload construction, and render all Finance UI. | Keep hooks, state, report filtering, sorting, pagination, totals/profit, submit validation, payload construction, and mutation calls in parent. Move presentation sections out. |
| `submit` | Validates required title, calls `createTransaction.mutateAsync({ transactionType, adjustmentType, category, title, quantity, unitPrice, note })`, resets selected form fields, and maps action errors. | Protected in parent. |
| `reportTransactions` | Filters transaction query data by selected month/year period. | Protected in parent. |
| `sortedTransactions` | Sorts filtered transactions by `NEWEST` or `OLDEST`. | Protected in parent. |
| `visibleTransactions` | Slices sorted transactions by page and page size. | Protected in parent. |
| `totals`, `profit`, `profitTone` | Uses existing finance calculation helpers and current filtered data. | Protected in parent. |
| `TransactionBadge` | Badge presentation based on transaction type and adjustment type. | Move to presentation file without changing labels or tones. |
| `getCategoryLabel`, `formatSignedCurrency` | Display formatting helpers for list/table presentation. | Move to presentation file as presentation-only helpers. |
| `getTime`, `isInReportPeriod`, `getFinanceActionErrorMessage` | Date filtering/sorting and action-error mapping. | Keep in parent. |

## State Ownership Map

All state remains owned by `FinancePageClient`:

- `transactionType`
- `adjustmentType`
- `category`
- `title`
- `note`
- `quantity`
- `unitPrice`
- `isFormOpen`
- `reportPeriod`
- `reportMonth`
- `reportYear`
- `sortBy`
- `pageSize`
- `currentPage`
- `actionError`
- `actionSuccess`

Query and mutation state remain owned by hooks:

- `useCurrentUser`
- `useTransactions`
- `useFinanceMutations`
- `createTransaction`

## Handler Map

Handlers that must remain parent-owned:

- `submit`
- `setTransactionType`
- `setAdjustmentType`
- `setCategory`
- `setTitle`
- `setNote`
- `setQuantity`
- `setUnitPrice`
- `setIsFormOpen`
- `setReportPeriod`
- `setReportMonth`
- `setReportYear`
- `setSortBy`
- `setPageSize`
- `setCurrentPage`
- `refetch`

## Query And Mutation Map

Parent-owned and unchanged:

- `useTransactions({ period: reportPeriod, month: reportMonth, year: reportYear })`
- `createTransaction.mutateAsync({ transactionType, adjustmentType, category, title, quantity, unitPrice, note })`
- report period defaults to current month.
- transaction list sort remains newest/oldest only.

## Protected Functions

Protected in this sprint:

- `submit`
- transaction create payload construction
- title-required validation
- report-period filtering
- newest/oldest sorting
- pagination slicing
- finance totals/profit calculation
- adjustment type semantics
- transaction category values
- query hooks and mutation hooks

## Protected Files

Must not be modified:

- `src/hooks/use-finance.ts`
- `src/lib/finance-calculation.ts`
- `src/repositories/finance-repository.ts`
- `src/app/api/finance/**`
- `src/types/domain.ts`
- `prisma/**`
- `middleware.ts`
