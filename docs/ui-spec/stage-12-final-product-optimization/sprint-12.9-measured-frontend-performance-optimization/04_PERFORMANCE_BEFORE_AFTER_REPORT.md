# Performance Before / After Report

| Optimization | File | Baseline | Result | Trade-off | Regression Result |
| --- | --- | --- | --- | --- | --- |
| Hoist Finance transaction table columns to module scope | `src/components/finance/finance-presentation.tsx` | `transactionColumns` was allocated inside `FinancePageView` on each render; columns do not use props/state. | `transactionColumns` is now a stable module-level const reused by the table and mobile rows. | Bundle size is effectively unchanged; source locality moves column definition above the component. | PASS |

## Bundle Result

| Route | Before | After | Notes |
| --- | ---: | ---: | --- |
| Shared First Load JS | 102 kB | 102 kB | No material bundle change expected or observed. |
| `/finance` First Load JS | 145 kB | 145 kB | Optimization targets render allocation, not bundle size. |
| `/runtime` First Load JS | 195 kB | 195 kB | Runtime untouched. |
| `/settings` First Load JS | 144 kB | 144 kB | Settings untouched. |

## Regression Notes

- `DataTable` receives the same column definitions with the same keys, headers, widths, alignment and render functions.
- Finance transaction sort, filter, pagination, visible rows and payloads are unchanged.
- `formatCurrency`, `formatSignedCurrency`, `getTransactionAmountClass`, `getCategoryLabel` and `formatTransactionDate` remain the same functions.
