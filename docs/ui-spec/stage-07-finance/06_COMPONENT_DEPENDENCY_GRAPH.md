# Component Dependency Graph

Status: Sprint 7.0 baseline

## Current Graph

```text
src/app/finance/page.tsx
-> requirePageUser('/finance')
-> AppShell
-> FinancePageClient
```

```text
FinancePageClient
-> useCurrentUser
-> hasPermission
-> canWriteFinance
```

```text
FinancePageClient
-> useTransactions
-> fetchTransactions
-> GET /api/finance/transactions
-> listSessionTransactions
-> prisma.session_transactions
```

```text
FinancePageClient
-> useFinanceMutations
-> createTransaction
-> POST /api/finance/transactions
-> createSessionTransaction
```

```text
FinancePageClient
-> getFinanceTotals
-> getSignedAmount
-> normalizeAdjustmentType
```

```text
FinancePageClient
-> PageShell / PageHeader / ToolbarCard / SectionCard
-> Button / Input / Select / StatusBadge / PaginationControls / EmptyState
```

## Required Sprint 7.0 Graph

```text
Finance Page
-> Report Filter
-> Finance Query
-> Summary Data
```

Details:

```text
FinancePageClient
-> reportPeriod / reportMonth / reportYear
-> useTransactions({ period, month, year })
-> fetchTransactions(params)
-> GET /api/finance/transactions
-> listSessionTransactions({ from, to, sessionId })
-> reportTransactions
-> getFinanceTotals(reportTransactions)
```

```text
Finance Page
-> Entry Form
-> Existing Submit Handler
-> Finance Mutation
```

Details:

```text
FinancePageClient form
-> submit(event)
-> createTransaction.mutateAsync({
     transactionType,
     adjustmentType,
     category,
     title,
     quantity,
     unitPrice,
     note
   })
-> POST /api/finance/transactions
-> createSessionTransaction
```

```text
Finance Page
-> Transaction List
-> Existing Finance Data
-> Existing Actions
```

Details:

```text
FinancePageClient
-> reportTransactions
-> sortedTransactions
-> visibleTransactions
-> TransactionBadge
-> formatSignedCurrency
-> PaginationControls
```

Current existing actions:

- report period selection
- sort newest/oldest
- page-size selection
- pagination
- create transaction submit when permitted
- expand/collapse create form

No row-level transaction edit/delete/detail action exists in the current baseline.

## Candidate Presentation Graph

```text
FinancePageClient
-> PageShell
-> PageHeader
-> FilterBar
-> StatCard
-> FormSection
-> DataTable
-> PaginationControls
-> EmptyState / LoadingState / ErrorState
```

## Protected Dependencies

The following dependencies are read-only for Stage 07:

- `useTransactions`
- `useFinanceMutations`
- `fetchTransactions`
- `createTransaction`
- `listSessionTransactions`
- `createSessionTransaction`
- `getFinanceTotals`
- `getSignedAmount`
- `normalizeAdjustmentType`
- `requireApiPermission`
- Prisma models and migrations

## Protected Data Contracts

- `SessionTransactionSummary`
- transaction payload fields
- report period query params
- React Query key: `['finance', 'transactions', params]`
- mutation invalidation keys:
  - `['finance', 'transactions']`
  - `['dashboard', 'summary']`
  - `['schedule']`
