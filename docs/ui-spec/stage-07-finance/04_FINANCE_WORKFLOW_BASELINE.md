# Finance Workflow Baseline

Status: Baseline locked

## View Finance

1. User opens `/finance`.
2. UI checks current user permission context.
3. Page requests transactions for the selected report period.
4. Page calculates totals from the returned transactions.
5. Page renders KPIs and transaction list.

## Report Period

Current state:

- `reportPeriod`: `MONTH` or `YEAR`
- `reportMonth`: `YYYY-MM`, defaults to current month
- `reportYear`: `YYYY`, defaults to current year

Current API query:

- monthly: `period=MONTH&month=YYYY-MM`
- yearly: `period=YEAR&year=YYYY`

Stage 07 must not change this state or query contract.

## Create Manual Transaction

Only users with `finance.manage` see the create form.

Form state:

- `transactionType`
- `adjustmentType`
- `category`
- `title`
- `note`
- `quantity`
- `unitPrice`

Submit payload:

```ts
{
  transactionType,
  adjustmentType,
  category,
  title,
  quantity,
  unitPrice,
  note
}
```

Stage 07 must not add or remove payload fields.

## Totals

Totals come from:

- `getFinanceTotals(reportTransactions)`
- `income - expense` for profit

Stage 07 must not change how these values are calculated.

## List Behavior

Current behavior:

- list is scoped to the selected report period
- sort can be `NEWEST` or `OLDEST`
- page size can be `10`, `20`, or `50`
- pagination is client-side over the already fetched period data

Stage 07 may improve presentation only.
