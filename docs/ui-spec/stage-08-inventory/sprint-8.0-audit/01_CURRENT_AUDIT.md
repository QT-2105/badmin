# Current Audit

Status: Complete

## Source Areas Audited

- Inventory route: `/inventory`.
- Inventory page: `src/app/inventory/page.tsx`.
- Inventory client: `src/components/inventory/inventory-page-client.tsx`.
- Inventory hooks: `src/hooks/use-inventory.ts`.
- Inventory service: `src/services/inventory-service.ts`.
- Inventory repository: `src/repositories/inventory-repository.ts`.
- Inventory API routes:
  - `src/app/api/inventory/products/route.ts`
  - `src/app/api/inventory/products/[productId]/route.ts`
  - `src/app/api/inventory/movements/route.ts`

## UI Areas Audited

- Inventory route and page.
- Page header.
- Toolbar.
- Search: not present.
- Filters: report period only.
- KPI cards.
- Stock summary.
- Product list.
- Product row/card.
- Product create form.
- Product edit form.
- Product detail: embedded in row, no separate detail workflow.
- Movement list.
- Movement create form.
- Import form.
- Sale form.
- Consumption form: user-facing consumption maps to source `PLAY_USAGE`.
- Adjustment form.
- Movement history.
- Movement detail: embedded in row.
- Session relation presentation: not explicit in Inventory page.
- Unit conversion presentation.
- Low stock presentation: not present in Inventory page.
- Loading, empty, error, and success feedback.
- Light/dark mode risks.
- Desktop, tablet landscape, tablet portrait, and mobile risks.
- Accessibility risks.
- Hard-coded color, spacing, radius, and shadow.
- Shared component usage.

## P0 Findings and Risks

- No confirmed wrong stock value or wrong unit display was found in source.
- P0 risk: movement type UI must make `SALE`, `PLAY_USAGE`, `ADJUSTMENT`, and `OTHER` visually distinct enough to prevent wrong payload submission.
- P0 risk: tablet overflow can make product and movement actions difficult to access.
- P0 risk: movement history currently uses custom grid rows rather than shared/native table semantics.

## P1 Findings

- Report filter should align visually with Stage 07.
- KPI cards should align with newer summary card hierarchy.
- Product table and movement list readability can improve.
- Product/import/outbound form grouping can improve.
- Feedback states can be more consistent.
- Responsive density needs tablet-first tuning.

## P2 Findings

- Hover/focus polish.
- Movement badge wrapping.
- Sticky header visual polish.
- Long title/note handling.
- Optional success feedback if it does not alter mutation behavior.

## Protected Baseline

No source changes were made in Sprint 8.0.

