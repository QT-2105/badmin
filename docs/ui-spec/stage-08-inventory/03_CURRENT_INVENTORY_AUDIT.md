# Current Inventory Audit

Status: Complete for Sprint 8.0 baseline

## Route

- Route: `/inventory`
- Page: `src/app/inventory/page.tsx`
- Client: `src/components/inventory/inventory-page-client.tsx`
- Shell: `AppShell`
- Auth: `requirePageUser('/inventory')`
- Permission gate: management controls depend on `inventory.manage`.

## Source Files Audited

- `src/app/inventory/page.tsx`
- `src/components/inventory/inventory-page-client.tsx`
- `src/hooks/use-inventory.ts`
- `src/services/inventory-service.ts`
- `src/repositories/inventory-repository.ts`
- `src/app/api/inventory/movements/route.ts`
- `src/app/api/inventory/products/route.ts`
- `src/app/api/inventory/products/[productId]/route.ts`
- `src/types/domain.ts`
- `docs/06-database-constitution.md`
- `docs/08-ui-ux-constitution.md`
- `rules/protected-modules.yaml`

## Current Data Flow

```text
InventoryPageClient
-> useInventoryProducts()
-> inventory-service.fetchProducts()
-> GET /api/inventory/products
-> inventory-repository.listShuttlecockProducts()
-> prisma.shuttlecock_products + shuttlecock_inventory + shuttlecock_movements
```

```text
InventoryPageClient
-> useInventoryMovements()
-> inventory-service.fetchMovements()
-> GET /api/inventory/movements
-> inventory-repository.listShuttlecockMovements()
-> prisma.shuttlecock_movements
```

```text
InventoryPageClient
-> useInventoryMutations()
-> createProduct/updateProduct/deleteProduct/createMovement()
-> inventory-service
-> inventory API routes
-> inventory-repository mutations
-> React Query invalidation
```

## UI Area Audit

| Area | Current state | Audit result |
| --- | --- | --- |
| Inventory route | `/inventory`, protected by page auth. | PASS. Route must remain unchanged. |
| Inventory page | One client page owns presentation, state, handlers, and local derived UI totals. | PASS WITH NOTES. Presentation changes must not touch state/payload logic. |
| Page header | Uses `PageHeader` with operational description. | PASS. Copy can be refined only as presentation. |
| Toolbar | Uses `ToolbarCard` for report period. | P1. Should align visually with Stage 07 `FilterBar` pattern, but state/handlers must remain unchanged. |
| Search | No search UI exists. | N/A. Do not add search in Stage 08. |
| Filters | Only report period month/year filter exists. | PASS. Do not add product/movement filters. |
| KPI cards | Uses `MetricCard` for product count, stock, stock value, usage cost, sales, total outbound. | P1. Semantic tone and hierarchy can be refined; values/formulas protected. |
| Stock summary | Derived from `products` via `totals` and `reportTotals`. | PASS. Do not change calculations. |
| Product list | Custom native table inside `SectionCard`. | P1. Can improve table readability or migrate presentation to shared primitive if columns/data are preserved. |
| Product row/card | Product row displays name, brand, balls/tube, status, stock, prices, values, actions. | P1. Density and touch targets can improve. |
| Product create form | Collapsible form with name, brand, balls/tube, status. | P1. Grouping/labels can improve; payload protected. |
| Product edit form | Reuses product form after `editProduct`. | PASS WITH NOTES. Preserve `editingProductId`, defaults, submit behavior. |
| Product detail | No separate product detail panel exists. Detail is embedded in row. | N/A. Do not add product detail workflow in Stage 08. |
| Movement list | Custom grid/list with sticky header. | P1/P0 risk. Custom grid has weaker table semantics and tablet overflow risk. |
| Movement create form | Shared outbound form creates sale, play usage, adjustment, other. | P0 risk. UI must not obscure movement type or send wrong payload. |
| Import form | Separate import form sends `IMPORT`. | PASS WITH NOTES. Presentation can improve; payload protected. |
| Sale form | Outbound `SALE` uses tubes and sale price per tube. | PASS WITH NOTES. Preserve tube-to-piece conversion contract. |
| Consumption form | User-facing chi cầu hao ca uses source value `PLAY_USAGE`. | PASS WITH NOTES. Do not rename API/DB value to `CONSUMPTION`. |
| Adjustment form | Uses actual stock in pieces and repository-side difference. | PASS WITH NOTES. Do not move difference logic. |
| Movement history | Shows latest movements with pagination. | P1. Readability/accessibility can improve; order protected. |
| Movement detail | Embedded title/note/product/time in row. | P2. Long title/note handling can improve. |
| Session relation presentation | No explicit session relation column/control in Inventory page. Session context appears only in title/note for generated usage movements. | N/A. Do not add session relation UI in Stage 08. |
| Unit conversion presentation | Existing helpers show tube/piece display via `formatTubes`, previews via `estimateOutboundBalls`. | PASS. Do not change formulas or rounding. |
| Low stock presentation | No low-stock Inventory page panel exists. Dashboard owns low-stock alert. | N/A. Do not add low-stock feature in Stage 08. |
| Loading state | Product load uses `NoticeCard`; movement loading uses inline text. | P1. Can standardize feedback presentation. |
| Empty state | Product and movement empty states exist via `EmptyState`. | PASS WITH NOTES. Can improve copy/placement. |
| Error state | Product load and action errors use `NoticeCard`. | P1. Can improve operator copy and retry presentation if handler exists. |
| Success feedback | No explicit success state; mutation success clears forms. | P2. Adding non-invasive success feedback is possible only if it does not alter mutation behavior. |
| Light mode | Uses semantic tokens mostly. | PASS WITH NOTES. Needs browser QA. |
| Dark mode | Uses semantic tokens mostly. | PASS WITH NOTES. Needs browser QA. |
| Desktop | Wide tables work with internal scroll. | PASS WITH NOTES. Density can improve. |
| Tablet landscape | Wide tables and forms may need better section sizing. | P0 risk. Must avoid page-level overflow and preserve actions. |
| Tablet portrait | Forms stack; wide tables need bounded scroll. | P1. Needs responsive smoke pass. |
| Mobile | Smoke support through overflow; not fully optimized. | P1. Do not hide critical stock actions. |
| Accessibility | Labels exist; custom movement grid is less semantic than table. | P1/P0 risk. Improve table/list semantics and focus clarity safely. |
| Hard-coded colors | Mostly tokenized classes: `text-success`, `text-danger`, `text-info`, `bg-surface-muted`, `border-border`. | PASS WITH NOTES. Continue avoiding raw colors. |
| Hard-coded spacing | Uses many fixed Tailwind grid templates and heights. | P1. Can normalize density without changing structure. |
| Hard-coded radius | Uses `rounded-lg`, `rounded-xl`. | P2. Consistency pass later. |
| Hard-coded shadow | No major custom shadow found in Inventory page. | PASS. |
| Shared component usage | Uses Stage 01/02 primitives but not `FilterBar`, `StatCard`, or `DataTable`. | P1. Safe adoption should be incremental. |

## Current Shared Components

- `PageShell`
- `PageHeader`
- `ToolbarCard`
- `MetricCard`
- `SectionCard`
- `NoticeCard`
- `Button`
- `Input`
- `Select`
- `EmptyState`
- `StatusBadge`
- `PaginationControls`

## Missing or Not Present

Do not add these in Stage 08 unless explicitly requested:

- Search.
- Additional filters beyond report period.
- Low-stock management panel.
- Product detail drawer/page.
- Movement detail drawer/page.
- Session relation selector or explicit session relation column.
- New stock reports.

## Current Logic That Must Be Preserved

- `totals` derived from `products`.
- `reportTotals` derived from `movements` and selected report period.
- `sortedMovements` newest-first.
- `visibleMovements` based on current page and page size.
- Product create/update/delete handlers.
- Import submit handler.
- Outbound submit handler.
- Movement payload mapping per outbound type.
- Permission gate for product and movement management.
- Query keys and invalidation behavior in `useInventoryMutations`.

## Protected Files

- `src/components/inventory/inventory-page-client.tsx` for handlers, state keys, derived totals, permissions, and payload mapping.
- `src/hooks/use-inventory.ts`
- `src/services/inventory-service.ts`
- `src/repositories/inventory-repository.ts`
- `src/app/api/inventory/movements/route.ts`
- `src/app/api/inventory/products/route.ts`
- `src/app/api/inventory/products/[productId]/route.ts`
- `src/types/domain.ts`
- `prisma/**`

## Protected Functions

UI state and handlers in `InventoryPageClient`:

- `submitProduct`
- `editProduct`
- `removeProduct`
- `submitImport`
- `submitOutbound`
- `totals`
- `reportTotals`
- `sortedMovements`
- `visibleMovements`
- `formatQuantity`
- `formatTubes`
- `isInReportPeriod`
- `estimateOutboundBalls`
- `formatCreatedAt`
- `getTime`
- `MovementBadge`

Hook contracts:

- `useInventoryProducts`
- `useShuttlecockProductOptions`
- `useInventoryMovements`
- `useInventoryMutations`

Service contracts:

- `fetchProducts`
- `fetchProductOptions`
- `createProduct`
- `updateProduct`
- `deleteProduct`
- `fetchMovements`
- `createMovement`

Repository contracts:

- `listShuttlecockProducts`
- `listShuttlecockProductOptions`
- `createShuttlecockProduct`
- `updateShuttlecockProduct`
- `deleteShuttlecockProduct`
- `listShuttlecockMovements`
- `createShuttlecockMovement`
- `normalizeMovementType`
- `movementTotalAmount`
- `mapProduct`
- `assertPositiveInteger`
- `assertNonNegativeInteger`
- `assertPositiveMoney`

## P0 Findings and Risks

- No confirmed wrong stock value or wrong unit display was found during source audit.
- P0 risk: outbound form combines multiple movement types; visual grouping must keep `SALE`, `PLAY_USAGE`, `ADJUSTMENT`, and `OTHER` unmistakable to avoid operator payload mistakes.
- P0 risk: movement type labels must remain readable, especially `Chi cầu hao ca`, because wrong movement interpretation can affect stock/finance reconciliation.
- P0 risk: tablet overflow can make product or movement actions difficult to access.
- P0 risk: custom movement grid has weaker table semantics than a native table, which can affect accessibility.

## P1 Findings

- Report filter presentation differs from Dashboard/Finance.
- KPI cards use older `MetricCard` rather than the newer Stage 02 `StatCard` pattern.
- Product table readability can improve with shared table conventions.
- Product form grouping can be clearer.
- Import/outbound forms can be clearer without changing fields.
- Movement list should improve numeric alignment, row density, and title/note hierarchy.
- Loading, empty, and error states can be more consistent with Stage 07.
- Responsive layout needs tablet-first tuning.

## P2 Findings

- Hover/focus polish can improve on product actions and movement rows.
- Movement badge sizing/wrapping can be polished.
- Product table sticky header can visually align with shared table header.
- Success feedback can be considered if it does not alter mutation behavior.
- Radius/spacing can be normalized after major presentation consistency work.

## Protected Diff Baseline

At Sprint 8.0 audit time, no diff was found for:

- `src/components/inventory/inventory-page-client.tsx`
- `src/hooks/use-inventory.ts`
- `src/services/inventory-service.ts`
- `src/repositories/inventory-repository.ts`
- `src/app/api/inventory/**`
- `prisma/**`

## Sprint 8.0 Conclusion

Inventory is ready for controlled presentation-only work. The highest-risk areas are movement form clarity, tablet overflow, and movement list semantics. All future sprints must preserve payloads, calculations, movement values, query keys, mutations, cache invalidation, API, repository, service, database, Prisma, route, and permission behavior.
