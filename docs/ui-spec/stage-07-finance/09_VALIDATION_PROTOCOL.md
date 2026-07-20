# Validation Protocol

Status: Required

## Commands

Run after implementation sprints:

```bash
npm run lint
npm run typecheck
```

Run at checkpoint and completion:

```bash
npm run build
npm run guard:no-db-schema-automation
```

## Protected Diff

Check that protected logic did not change:

```bash
git diff -- src/hooks/use-finance.ts src/services/finance-service.ts src/repositories/finance-repository.ts src/app/api/finance/transactions/route.ts src/lib/finance-calculation.ts prisma
```

## Manual QA Checklist

- report period month/year still requests the same data
- revenue/expense/profit values are unchanged
- create transaction payload is unchanged
- validation messages still appear
- sort newest/oldest still works
- pagination still works
- permission hides create form for users without `finance.manage`
- light and dark mode are readable
- transaction list does not cause page-wide horizontal overflow
