# Visual Specification

Status: Proposed

## Page Header

- Use the established `PageHeader` hierarchy.
- Title must be visually stronger than section titles.
- Description should explain operational finance without adding policy claims.

## Report Filter

- Compact single-row presentation on desktop/tablet landscape.
- Stack only when viewport requires it.
- Use consistent input height and width.
- Preserve current select and date input behavior.

## KPI Summary

- Use semantic tones:
  - revenue: success/income
  - expense: danger/expense
  - profit positive: success
  - profit negative: danger
  - profit zero: neutral
- Labels must contrast against card background in light and dark mode.
- Values must be prominent but not oversized.

## Entry Form

- Keep all current fields.
- Improve alignment, grouping, spacing, and touch targets.
- Required title should remain visually obvious.
- Do not change submit payload or validation timing.

## Transaction List

- Prefer `DataTable` for accessible table semantics.
- Preserve current columns:
  - type
  - content
  - quantity x unit price
  - amount
  - time
- Numeric columns align right.
- Long title/note wraps without breaking row layout.
- Horizontal overflow is bounded inside the list surface.

## Feedback States

- Loading must not hide current page structure.
- Error must be visible and concise.
- Empty state must live inside the list area.
- Action error must not shift critical controls excessively.

## Light/Dark

- No raw dark-only color assumptions.
- Badges must remain readable in both themes.
- Deduction/negative amount color must meet contrast.

## Accessibility

- Existing controls need accessible names.
- Focus-visible must be visible for filters, form controls, submit, sort, pagination.
- Table/list headers must remain perceivable.
- Touch targets should be at least approximately 40px.
