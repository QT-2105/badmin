# Sprint 11.13A — Inventory Presentation Refactor Baseline

## Status

BASELINE COMPLETED

## Line Count Baseline

Command:

```bash
wc -l src/components/inventory/inventory-page-client.tsx
```

Result:

- `src/components/inventory/inventory-page-client.tsx`: 967 lines

## Function Map

| Function / block | Current responsibility | Refactor decision |
| --- | --- | --- |
| `InventoryPageClient` | Query orchestration, mutation orchestration, permission lookup, form state, report state, pagination state, submit handlers, render all inventory UI. | Keep orchestration, state, calculations, submit handlers, mutation calls, and permission data in parent. Move presentational sections out. |
| `submitProduct` | Product create/update submit handler and payload. | Protected in parent. |
| `editProduct` | Opens edit UI and maps selected product into parent form state. | Protected in parent. |
| `requestRemoveProduct` | Opens delete confirmation. | Protected in parent. |
| `confirmRemoveProduct` | Product delete mutation call. | Protected in parent. |
| `submitImport` | Import movement submit handler and payload. | Protected in parent. |
| `submitOutbound` | Outbound movement submit handler and payload for `SALE`, `PLAY_USAGE`, `ADJUSTMENT`, `OTHER`. | Protected in parent. |
| `isInReportPeriod` | Existing report-period filter helper. | Keep in parent. |
| `getTime` | Existing movement sort helper. | Keep in parent. |
| `formatQuantity`, `formatTubes`, `estimateOutboundBalls`, `formatCreatedAt`, display helper components | Presentation display helpers. | Move to inventory presentation file as module-local presentation helpers. |

## State Ownership Map

All state remains owned by `InventoryPageClient`:

- `productForm`
- `editingProductId`
- `importProductId`
- `importTitle`
- `importTubes`
- `costPricePerTube`
- `usagePricePerTube`
- `importNote`
- `outboundType`
- `outboundProductId`
- `outboundTitle`
- `outboundTubes`
- `outboundBalls`
- `salePricePerTube`
- `actualQuantityBall`
- `outboundNote`
- `actionError`
- `reportPeriod`
- `reportMonth`
- `reportYear`
- `isProductFormOpen`
- `stockFormTab`
- `movementPageSize`
- `movementPage`
- `pendingDeleteProduct`

## Handler Map

Handlers that must remain parent-owned:

- `submitProduct`
- `editProduct`
- `requestRemoveProduct`
- `confirmRemoveProduct`
- `submitImport`
- `submitOutbound`
- `setReportPeriod`
- `setReportMonth`
- `setReportYear`
- `setProductForm`
- `setEditingProductId`
- `setIsProductFormOpen`
- `setStockFormTab`
- `setMovementPageSize`
- `setMovementPage`
- `setPendingDeleteProduct`

## Query And Mutation Map

Parent-owned and unchanged:

- `useCurrentUser`
- `useInventoryProducts`
- `useInventoryMovements`
- `useInventoryMutations`
- `createProduct`
- `updateProduct`
- `deleteProduct`
- `createMovement`

## Protected Functions

Protected in this sprint:

- `submitProduct`
- `submitImport`
- `submitOutbound`
- `confirmRemoveProduct`
- `isInReportPeriod`
- `estimateOutboundBalls` display use must not affect payload
- inventory hook calls
- mutation payload objects
- movement type semantics
- stock and average-cost calculations owned by service/repository

## Protected Files

Must not be modified:

- `src/app/api/inventory/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/**`
- `src/types/domain.ts`
- `src/lib/badminton-store.ts`
- `src/lib/auth/**`
- `prisma/**`
- `middleware.ts`

