# Inventory Safety Contract

Stage 08 is Presentation Layer only.

## Non-Negotiable Protected Semantics

Do not change:

1. `current_stock`.
2. `average_cost`.
3. `tube_quantity`.
4. `default_sale_price`.
5. `movement_type`.
6. `IMPORT` semantics.
7. `SALE` semantics.
8. `CONSUMPTION` semantics.
9. `ADJUSTMENT` semantics.
10. `quantity`.
11. `unit_cost`.
12. `unit_price`.
13. `total_amount`.
14. `session_id`.
15. `created_at`.
16. Product relation.
17. Stock update formula.
18. Weighted average cost formula.
19. Tube-to-piece conversion.
20. Piece-to-tube display calculation.
21. Movement ordering.
22. Product creation payload.
23. Product update payload.
24. Movement creation payload.
25. Validation.
26. Query keys.
27. Mutations.
28. Cache invalidation.
29. API.
30. Repository.
31. Service.
32. Database.
33. Prisma.
34. Route.
35. Permission.

## Current Source Naming Note

The owner-facing concept `CONSUMPTION` maps to the current source/database movement value `PLAY_USAGE`.

Stage 08 must not rename `PLAY_USAGE`, change API payloads, or change database values. UI copy may say "Chi cầu hao ca" / consumption as presentation text only.

## Calculation Boundary

- Do not move inventory calculations into shared UI components.
- Do not add new rounding behavior.
- Do not change units stored in the database.
- Database current stock remains stored in pieces/balls.
- If UI displays tubes and pieces, use existing data or existing helper behavior.
- Do not change persisted values.
- Do not change helper semantics such as piece-to-tube display calculation.

Shared UI components must remain rendering primitives. They must not own stock, price, conversion, average-cost, or movement calculations.

## Protected Source Files

- `src/components/inventory/inventory-page-client.tsx` for handlers, state keys, derived totals, permissions, and payload mapping.
- `src/repositories/inventory-repository.ts`
- `src/services/inventory-service.ts`
- `src/hooks/use-inventory.ts`
- `src/app/api/inventory/movements/route.ts`
- `src/app/api/inventory/products/route.ts`
- `src/app/api/inventory/products/[productId]/route.ts`
- `src/types/domain.ts`
- `prisma/**`

## Protected Functions and Contracts

- `useInventoryProducts`
- `useShuttlecockProductOptions`
- `useInventoryMovements`
- `useInventoryMutations`
- `fetchProducts`
- `fetchProductOptions`
- `createProduct`
- `updateProduct`
- `deleteProduct`
- `fetchMovements`
- `createMovement`
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

`src/components/inventory/inventory-page-client.tsx` may be edited only for presentation work. Existing state keys, form fields, handlers, payload mapping, permission gates, and derived calculations must be preserved.

## Stop Rule

If a visual change requires changing inventory logic:

1. Do not implement it.
2. Add it to Out Of Scope.
3. Name the affected file.
4. Explain the risk.
5. Stop the sprint if safe UI work cannot continue.
