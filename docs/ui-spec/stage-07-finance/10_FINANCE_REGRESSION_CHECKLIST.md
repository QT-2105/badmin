# Finance Regression Checklist

Status: Required before completion

- [ ] `/finance` loads.
- [ ] user with `finance.view` can view transactions.
- [ ] user without `finance.manage` cannot see create form.
- [ ] user with `finance.manage` can see create form.
- [ ] monthly report period keeps current behavior.
- [ ] yearly report period keeps current behavior.
- [ ] transaction list is scoped to selected period.
- [ ] sort newest works.
- [ ] sort oldest works.
- [ ] page size works.
- [ ] pagination works.
- [ ] title validation works.
- [ ] normal income payload unchanged.
- [ ] normal expense payload unchanged.
- [ ] deduction income payload unchanged.
- [ ] deduction expense payload unchanged.
- [ ] quantity and unit price values are preserved.
- [ ] total amount display matches current signed amount behavior.
- [ ] dashboard summary invalidation behavior unchanged.
- [ ] schedule invalidation behavior unchanged.
- [ ] no protected finance file diff.
- [ ] no database or Prisma diff.
