# Sprint 12.7D Protected Files

## Protected Finance Logic

- `src/components/finance/finance-page-client.tsx`
- `src/lib/finance-calculation.ts`
- `src/hooks/use-finance.ts`
- `src/services/**`
- `src/repositories/**`
- `src/app/api/finance/**`
- `src/types/domain.ts`
- `prisma/**`

## Protected Contracts

- Revenue formula.
- Expense formula.
- Profit formula.
- Transaction type semantics.
- Adjustment/deduction semantics.
- Category values.
- Session relation.
- Payment status.
- Payment method.
- API payload.
- Mutation behavior.
- Query keys and cache invalidation.
- Report period, filter and sort behavior.

## Protected Functions / Calls

- `getFinanceTotals`.
- `getSignedAmount`.
- `normalizeAdjustmentType`.
- `useTransactions`.
- `useFinanceMutations`.
- `createTransaction.mutateAsync`.
- Report period filtering, sorting and pagination slicing in `FinancePageClient`.

