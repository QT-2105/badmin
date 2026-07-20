# Finance Regression Report

Status: Complete

Decision: PASS WITH NOTES

## Validation Method

Regression was checked by source-level contract review and full build validation.

This sprint did not perform live browser/database transaction creation. Items that require live DB mutation are marked as preserved by unchanged source contract rather than manually executed.

## Accessibility Results

| Area | Result | Notes |
| --- | --- | --- |
| Form labels | PASS | Form fields use wrapping labels; report controls use `aria-label`. |
| Error association | PASS | Title validation uses `aria-invalid` and `aria-describedby`. |
| Feedback announcement | PASS | Warning uses `role="alert"`; success uses `role="status"` with polite live region. |
| Button accessible name | PASS | Buttons have visible text labels. |
| Focus-visible | PASS | Shared primitives preserve focus-visible styling. |
| Keyboard navigation | PASS | Native controls and semantic table remain keyboard reachable. |
| Dialog/drawer focus | N/A | Finance currently has no dialog/drawer. |
| Table semantics | PASS | Transaction list uses `DataTable` native table semantics. |
| Contrast | PASS | Semantic tokens/status primitives used; no new raw color dependency. |
| Touch target | PASS | Shared controls and submit button maintain operational target sizing. |
| Reduced motion | PASS WITH NOTES | No new motion added; existing loading spinner remains unchanged. |
| Status not color-only | PASS | Badges include text labels. |

## Finance Regression Checklist

| # | Check | Result | Notes |
| --- | --- | --- | --- |
| 1 | Trang Finance tải được | PASS | Production build passes for `/finance`. |
| 2 | Report period giữ đúng mặc định | PASS | Default `reportPeriod` remains `MONTH`. |
| 3 | Date filter hoạt động | PASS | Existing `reportMonth`, `reportYear`, and handlers unchanged. |
| 4 | KPI giữ đúng giá trị | PASS | KPI still uses `getFinanceTotals(reportTransactions)`. |
| 5 | Tổng thu đúng | PASS | Income source/calculation unchanged. |
| 6 | Tổng chi đúng | PASS | Expense source/calculation unchanged. |
| 7 | Lợi nhuận đúng | PASS | Profit remains `totals.income - totals.expense`. |
| 8 | Tiền mặt đúng | N/A | Finance page does not currently expose cash KPI/control. |
| 9 | Chuyển khoản đúng | N/A | Finance page does not currently expose transfer KPI/control. |
| 10 | Chưa thu đúng | N/A | Finance page does not currently expose unpaid KPI/control. |
| 11 | Tạo phiếu Thu | PASS WITH NOTES | Submit payload path unchanged; not live-DB executed in this sprint. |
| 12 | Tạo phiếu Chi | PASS WITH NOTES | Submit payload path unchanged; not live-DB executed in this sprint. |
| 13 | Giảm thu nếu có | PASS | `DEDUCTION` option and label behavior unchanged. |
| 14 | Giảm chi nếu có | PASS | `DEDUCTION` option and label behavior unchanged. |
| 15 | Category mapping | PASS | `manualCategories` and `getCategoryLabel` unchanged by Sprint 7.8. |
| 16 | Quantity | PASS | Quantity field, state, and payload unchanged. |
| 17 | Unit price | PASS | Unit price field, state, and payload unchanged. |
| 18 | Total amount | PASS | Total calculation remains backend/service behavior; UI payload unchanged. |
| 19 | Payment method | N/A | Finance create form does not currently expose payment method. |
| 20 | Payment status | N/A | Finance create form does not currently expose payment status. |
| 21 | Session relation | N/A | Manual Finance form does not currently select a session. |
| 22 | Validation | PASS | Required title validation preserved; title input now has ARIA association. |
| 23 | Transaction list | PASS | Data source, columns, and values preserved through `DataTable`. |
| 24 | Pagination | PASS | Existing `PaginationControls`, page state, and handlers unchanged. |
| 25 | Detail action | N/A | No Finance row detail action exists. |
| 26 | Edit/delete nếu có | N/A | No Finance row edit/delete action exists. |
| 27 | Permission | PASS | `finance.manage` visibility gate unchanged. |
| 28 | Reload/cache behavior | PASS | Mutation invalidation/hook behavior unchanged; retry uses existing `refetch`. |
| 29 | Empty state | PASS | Same empty condition, improved no-data-period presentation. |
| 30 | Error state | PASS | Same error source, improved operator copy and retry presentation. |

## Validation Commands

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run guard:no-db-schema-automation`: PASS

## Protected Diff

Checked paths:

- `src/hooks/use-finance.ts`
- `src/services/**`
- `src/repositories/**`
- `src/app/api/finance/**`
- `src/lib/finance-calculation.ts`
- `src/types/domain.ts`
- `prisma/**`

Result: clean for Sprint 7.8 protected areas.

## Deferred Notes

- Live browser QA with real database transaction creation remains recommended before production signoff.
- Cash/transfer/unpaid/session relation/detail/edit/delete checks are N/A for the current Finance page because those controls/actions do not exist in source.

