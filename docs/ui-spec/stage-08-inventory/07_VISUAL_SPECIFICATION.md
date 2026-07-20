# Inventory Visual Specification

## Design Direction

The Inventory page should feel:

- Compact.
- Operational.
- Easy to scan.
- Consistent with Dashboard and Finance.
- Clear in both light and dark mode.

## Page Header

- Use the shared page header hierarchy.
- Keep copy operational and short.
- Avoid generic admin terminology.

## Report Filter

- Use compact one-line controls where viewport allows.
- Preserve month/year values and handlers.
- Match Finance/Dashboard density.

## Metrics

- Use semantic tones:
  - Stock/product count: info or inventory.
  - Stock value: inventory.
  - Sales: success/income.
  - Play usage: danger/expense.
  - Total outbound shuttlecock amount: neutral or violet if already supported.
- Values should be larger than labels.
- Supporting text should be readable but secondary.

## Product Catalog

- Prefer shared table presentation if it preserves columns and data.
- Numeric columns right-aligned with tabular numbers.
- Product name remains primary.
- Brand, balls per tube, and status are secondary.
- Actions must remain touch-friendly.

## Forms

- Keep forms compact.
- Preserve all fields.
- Labels must remain visible.
- Inputs must avoid accidental number steppers if shared primitive supports it.
- Submit buttons must be clear and disabled states must be legible.

## Movement History

- Preserve existing column values and newest-first order.
- Long title/note must wrap without breaking the row.
- Numeric columns right-aligned.
- Movement type badge must include text, not color-only meaning.

## Feedback States

- Loading should distinguish product loading and movement loading where possible.
- Empty states should distinguish no products and no movements.
- Error states should use operator-friendly copy.

## Responsive

- Desktop: dense two-level content with tables scrollable inside their own surfaces.
- Tablet landscape: keep metrics and catalog usable without page-level horizontal overflow.
- Tablet portrait: stack sections while keeping action buttons visible.
- Mobile: smoke support with bounded table overflow.

