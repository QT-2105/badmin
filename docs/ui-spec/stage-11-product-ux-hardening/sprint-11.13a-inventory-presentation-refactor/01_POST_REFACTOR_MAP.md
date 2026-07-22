# Sprint 11.13A — Post Refactor Map

## Status

COMPLETED

## Line Count Comparison

| File | Before | After | Notes |
| --- | ---: | ---: | --- |
| `src/components/inventory/inventory-page-client.tsx` | 967 | 363 | Parent now owns orchestration, state, permission, report filtering, pagination, submit handlers and mutation calls. |
| `src/components/inventory/inventory-presentation.tsx` | 0 | 1047 | New presentation-only module for Inventory sections and local display helpers. |

## Decomposition Implemented

`InventoryPageClient`

- Keeps `useCurrentUser`.
- Keeps `useInventoryProducts`.
- Keeps `useInventoryMovements`.
- Keeps `useInventoryMutations`.
- Keeps all form/report/pagination/delete-confirmation state.
- Keeps all submit handlers and mutation payloads.
- Keeps permission lookup through `hasPermission`.

Presentation module:

- `InventoryToolbar`
- `InventorySummary`
- `InventoryFeedback`
- `ProductTableSection`
- `MovementFormsSection`
- `MovementTableSection`
- Local presentation helpers: product/mobile card rendering, movement/mobile card rendering, display badges, field rendering, quantity and money display.

## State Ownership After Refactor

All state remains parent-owned in `InventoryPageClient`:

- Product form state.
- Product edit/open state.
- Import form state.
- Outbound form state.
- Report-period state.
- Action error state.
- Stock form tab state.
- Movement pagination state.
- Delete confirmation state.

Child components receive values and callbacks only.

## Handler Preservation

| Handler | Location after refactor | Preservation |
| --- | --- | --- |
| `submitProduct` | Parent | Preserved. |
| `editProduct` | Parent | Preserved. |
| `requestRemoveProduct` | Parent | Preserved. |
| `confirmRemoveProduct` | Parent | Preserved. |
| `submitImport` | Parent | Preserved. |
| `submitOutbound` | Parent | Preserved. |
| Report setters | Parent, passed as props | Preserved. |
| Form setters | Parent, passed as props | Preserved. |
| Pagination setters | Parent, passed as props | Preserved. |

## Query And Mutation Preservation

The following remain only in `InventoryPageClient`:

- `useInventoryProducts`
- `useInventoryMovements`
- `useInventoryMutations`
- `createProduct.mutateAsync`
- `updateProduct.mutateAsync`
- `deleteProduct.mutateAsync`
- `createMovement.mutateAsync`

No query key, mutation, cache invalidation or inventory hook was moved into the presentation module.

## Payload Preservation

Product create/update payload remains:

```ts
productForm
```

Product update wrapper remains:

```ts
{ id: editingProductId, payload: productForm }
```

Import payload remains:

```ts
{
  productId: importProduct.id,
  movementType: 'IMPORT',
  title: importTitle,
  quantityTube: importTubes,
  costPricePerTube,
  usagePricePerTube,
  note: importNote
}
```

Outbound payload remains:

```ts
{
  productId: outboundProduct.id,
  movementType: outboundType,
  title: outboundTitle,
  quantityTube: outboundType === 'ADJUSTMENT' || outboundType === 'PLAY_USAGE' ? undefined : outboundTubes,
  quantityBall: outboundType === 'PLAY_USAGE' || outboundType === 'OTHER' ? outboundBalls : undefined,
  actualQuantityBall: outboundType === 'ADJUSTMENT' ? actualQuantityBall : undefined,
  salePricePerTube: outboundType === 'ADJUSTMENT' || outboundType === 'PLAY_USAGE' ? undefined : salePricePerTube,
  note: outboundNote
}
```

Delete payload remains:

```ts
pendingDeleteProduct.id
```

## Presentation Helpers Moved

Moved to `inventory-presentation.tsx` as display-only helpers:

- `formatQuantity`
- `formatTubes`
- `estimateOutboundBalls`
- `formatCreatedAt`
- `MovementBadge`
- `MovementContent`
- `MovementQuantity`
- `MoneyDetail`
- `AdjustmentDirection`

These helpers do not submit payloads, call mutations, own query keys, update stock, or calculate average cost.

## Protected Logic Confirmation

- `current_stock` calculation unchanged.
- `average_cost` calculation unchanged.
- Movement semantics unchanged.
- Quantity conversion behavior unchanged.
- Query/mutation ownership unchanged.
- Permission lookup unchanged.
- API, service, repository, Prisma and database unchanged.
