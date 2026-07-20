# Finance Safety Contract

Status: Required for all Stage 07 work

## Protected Behavior

The following behavior is protected and must remain unchanged:

- presentation-only boundary for all Stage 07 work
- manual transaction creation
- required title validation
- `entry_type`
- transaction type values: `INCOME`, `EXPENSE`
- `INCOME` / `EXPENSE` semantics
- adjustment type values: `NORMAL`, `DEDUCTION`
- `Giảm thu` / `Giảm chi` semantics
- category values currently used by the app
- `COURT_FEE`
- `SHUTTLE_SALE`
- `SHUTTLE_CONSUMPTION`
- `EXTRA_COURT`
- `OTHER`
- quantity and unit price multiplication
- `quantity`
- `unit_price`
- `total_amount`
- `quantity x unit_price` formula
- signed amount behavior for `DEDUCTION`
- finance totals from `getFinanceTotals`
- report period request parameters
- date range behavior
- month/year filtering semantics
- filter behavior
- sort behavior currently owned by the page
- pagination semantics currently owned by the page
- mutation invalidation behavior
- payment method
- payment status
- cash amount
- transfer amount
- unpaid amount
- finance permissions: `finance.view`, `finance.manage`
- optional session relation in the data model
- session relation
- revenue, expense, profit, and finance summary meaning

## Forbidden Changes

Stage 07 must not change:

1. `entry_type`.
2. `INCOME` / `EXPENSE` semantics.
3. `Giảm thu` / `Giảm chi` semantics.
4. Category values.
5. `COURT_FEE`.
6. `SHUTTLE_SALE`.
7. `SHUTTLE_CONSUMPTION`.
8. `EXTRA_COURT`.
9. `OTHER`.
10. `quantity`.
11. `unit_price`.
12. `total_amount`.
13. `quantity x unit_price` formula.
14. Payment method.
15. Payment status.
16. Session relation.
17. Report period.
18. Date range.
19. Filter behavior.
20. Sort order.
21. Finance summary.
22. Revenue.
23. Expense.
24. Profit.
25. Unpaid amount.
26. Cash amount.
27. Transfer amount.
28. API payload.
29. Query key.
30. Mutation.
31. Cache invalidation.
32. Repository.
33. Service.
34. Database.
35. Prisma.
36. Permission.
37. Route.
38. `getSignedAmount`.
39. `getFinanceTotals`.
40. `normalizeAdjustmentType`.
41. `createSessionTransaction`.
42. `listSessionTransactions`.
43. `refreshSessionFinance`.
44. API response shape.
45. Submit payload fields.
46. Existing client-side filtering/sorting semantics.
47. Existing pagination state behavior.

## Allowed Changes

Allowed changes are strictly presentational:

- semantic token replacement
- spacing and density
- typography hierarchy
- card/table/form presentation
- shared primitive adoption where props and behavior stay equivalent
- accessible labels for existing controls
- focus-visible, hover, disabled, and error styling
- responsive wrapping and bounded overflow

## Escalation

Stop and ask before any change that requires changing a handler signature, request payload, calculation helper, API route, repository query, service behavior, mutation side effect, query key, cache invalidation, permission guard, route, database model, or Prisma schema.

## Out Of Scope Protocol

If a UI change requires changing any forbidden item:

1. Do not modify source code.
2. Record the issue as `Out of Scope`.
3. Name the affected file or files.
4. State the risk.
5. Explain why the change touches protected finance behavior.
6. Stop the current sprint if it cannot continue safely.
