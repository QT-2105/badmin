# Information Architecture

Status: Proposed

## Priority Order

1. Page header: screen identity and finance purpose.
2. Report period controls: month/year scope.
3. KPI summary: revenue, expense, profit.
4. Create transaction form: available only to finance managers.
5. Feedback states: loading, error, action error.
6. Transaction list: audit and lookup.
7. Pagination.

## Operator Reading Model

The operator should answer these questions quickly:

- Which reporting period am I viewing?
- How much was collected?
- How much was spent?
- Is profit positive or negative?
- Which transactions explain the numbers?
- Can I create a manual adjustment without hunting for the form?

## Density Rules

- Keep KPI cards compact.
- Keep period controls one-line on desktop/tablet where possible.
- Keep transaction list scannable with clear type, title, category/note, quantity, amount, and time.
- Use horizontal overflow only inside the transaction list, not page-wide.

## Responsive Rules

- Desktop/laptop: KPI cards in a row, transaction list full width.
- Tablet landscape: keep period controls and form compact; list may scroll horizontally inside its card.
- Tablet portrait/mobile: stack controls, preserve create action, keep transaction rows readable.
