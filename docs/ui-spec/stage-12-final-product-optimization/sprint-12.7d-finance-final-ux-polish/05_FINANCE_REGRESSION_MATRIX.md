# Sprint 12.7D Finance Regression Matrix

## Regression Scope

This sprint validates source-level preservation and command validation. Live transaction creation against production data was not performed.

| Item | Result | Evidence |
| --- | --- | --- |
| Revenue formula unchanged | PASS | `src/lib/finance-calculation.ts` and `FinancePageClient` untouched. |
| Expense formula unchanged | PASS | `getFinanceTotals` untouched. |
| Profit formula unchanged | PASS | `profit = totals.income - totals.expense` untouched. |
| Category semantics unchanged | PASS | Category options and labels unchanged. |
| Session relation unchanged | PASS | No session relation code edited or added. |
| Payment status unchanged | PASS | Payment status is not exposed in current Finance UI and was not added. |
| Payment method unchanged | PASS | Payment method is not exposed in current Finance UI and was not added. |
| API unchanged | PASS | No API files edited. |
| Mutation unchanged | PASS | `FinancePageClient` and hooks untouched. |
| Payload unchanged | PASS | Submit payload construction untouched. |
| Report filters unchanged | PASS | Filter state/handlers untouched. |
| Sort/pagination unchanged | PASS | Sort and pagination logic untouched. |
| Empty state unchanged | PASS | Existing no-data period message preserved. |
| Danger tone discipline | PASS | Normal expense no longer uses danger presentation. |

## Command Validation

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run guard:no-db-schema-automation`: PASS
- `git diff --check`: PASS
- protected backend/logic diff: PASS

## Deferred

- Browser screenshot QA for long currency, light/dark and tablet/mobile Finance layouts.
- Live transaction creation regression against a seeded database.
