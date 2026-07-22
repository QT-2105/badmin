# Sprint 12.7E Protected Files

## Protected Inventory Logic

- `src/components/inventory/inventory-page-client.tsx`
- `src/hooks/use-inventory.ts`
- `src/services/inventory-service.ts`
- `src/repositories/inventory-repository.ts`
- `src/app/api/inventory/**`
- `src/types/domain.ts`
- `prisma/**`

## Protected Contracts

- `current_stock` / `quantityBall`.
- `average_cost` / `avgCostPerBall`.
- Movement calculation.
- Tube-to-piece conversion.
- Piece-to-tube display conversion.
- Movement type semantics.
- IMPORT, SALE, PLAY_USAGE, ADJUSTMENT and OTHER values.
- Product payload.
- Movement payload.
- Validation.
- API, mutation, query key and cache invalidation behavior.

## Protected Functions / Calls

- `submitProduct`.
- `submitImport`.
- `submitOutbound`.
- `confirmRemoveProduct`.
- `formatTubes` conversion formula.
- `estimateOutboundBalls`.
- `createMovement.mutateAsync`.
- `createProduct`, `updateProduct`, `deleteProduct` mutations.

