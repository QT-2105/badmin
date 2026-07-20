# Current Audit

## Source Areas Reviewed

- `src/components/inventory/inventory-page-client.tsx`
- `src/components/ui/data-table.tsx`
- Shared primitives already adopted from prior Inventory sprints:
  - `PageShell`
  - `PageHeader`
  - `SectionCard`
  - `NoticeCard`
  - `FilterBar`
  - `StatCard`
  - `DataTable`
  - `StatusBadge`
  - `Input`
  - `Select`
  - `Button`
  - `Skeleton`

## Accessibility Findings

### Labels

- Product, import, outbound, and report-period controls use visible labels or `aria-label`.
- Reusable Inventory field components preserve native input/select elements.
- Improvement required: helper text was visible but not programmatically associated with its field.

### Required State

- Required fields use native `required`.
- Required marker is visible for text fields.
- Improvement required: expose `aria-required` for custom wrapped controls.

### Error / Loading Announcement

- API/action errors were visible through `NoticeCard`.
- Improvement required: wrap error notices in live regions so screen readers receive updates.

### Tables / Lists

- Product and movement lists use `DataTable`.
- `DataTable` renders native `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`, and `aria-busy`.
- Numeric columns use right alignment and tabular number classes from previous sprints.

### Keyboard / Focus

- Controls remain native `button`, `input`, and `select`.
- Focus-visible behavior comes from shared primitives.
- No custom keyboard interaction was introduced in Sprint 8.11.

### Status Text

- Movement and product status use `StatusBadge` with text labels.
- Status is not color-only.

### Contrast / Touch Target

- Contrast and touch sizing inherit from Stage 01/01.5 primitives.
- No raw color, raw shadow, or non-token focus style was introduced.

## Inventory Regression Baseline

The Sprint 8.11 source audit confirms the following protected contracts are still present in the Inventory UI:

- Product create/edit remains handled by `submitProduct`.
- Import movement remains handled by `submitImport`.
- Outbound movements remain handled by `submitOutbound`.
- `IMPORT`, `SALE`, `PLAY_USAGE`, `ADJUSTMENT`, and `OTHER` movement values are unchanged.
- `ADJUSTMENT` form still submits `actualQuantityBall`.
- `PLAY_USAGE` still submits `quantityBall`.
- `SALE` still submits `quantityTube` and `salePricePerTube`.
- Product selection still submits product IDs from current product data.
- Stock, average cost, and movement calculations remain outside shared UI primitives.

## Regression Execution Note

The required sample data scenarios were not executed against production data in Sprint 8.11 because the project does not currently expose a dedicated automated inventory test harness or isolated fixture command. To avoid creating production inventory movements, Sprint 8.11 verifies the source contract, protected diff, and build validation instead.
