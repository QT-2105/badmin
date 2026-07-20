# Protected Files

Do not modify in Sprint 7.0:

- `src/app/finance/page.tsx`
- `src/components/finance/finance-page-client.tsx`
- `src/hooks/use-finance.ts`
- `src/services/finance-service.ts`
- `src/repositories/finance-repository.ts`
- `src/app/api/finance/transactions/route.ts`
- `src/lib/finance-calculation.ts`
- `src/types/domain.ts`
- `src/components/ui/**`
- `prisma/**`

These files are read-only for audit.

## Protected Functions And Contracts

- `FinancePage`
- `FinancePageClient`
- `submit`
- `useTransactions`
- `useFinanceMutations`
- `fetchTransactions`
- `createTransaction`
- `GET /api/finance/transactions`
- `POST /api/finance/transactions`
- `getReportRange`
- `listSessionTransactions`
- `createSessionTransaction`
- `refreshSessionFinance`
- `getFinanceTotals`
- `getSignedAmount`
- `normalizeAdjustmentType`
- `SessionTransactionSummary`
- React Query key `['finance', 'transactions', params]`
- mutation invalidation keys
- finance permissions `finance.view` and `finance.manage`

## Protected Finance Semantics

All items from `../02_FINANCE_SAFETY_CONTRACT.md` apply, including entry type, income/expense semantics, deduction semantics, category values, quantity, unit price, total amount, report period, date range, filter behavior, sort order, finance summary, API payload, query key, mutation, cache invalidation, repository, service, database, Prisma, permission, and route.
