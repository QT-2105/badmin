# Stage 08 Validation Protocol

## Per Sprint

Run after each source-changing sprint:

- `npm run lint`
- `npm run typecheck`

## Checkpoint Sprints

Run at larger checkpoints:

- `npm run build`
- `npm run guard:no-db-schema-automation`

## Protected Diff Check

Confirm no diff in:

- `src/hooks/use-inventory.ts`
- `src/services/inventory-service.ts`
- `src/repositories/inventory-repository.ts`
- `src/app/api/inventory/**`
- `src/types/domain.ts`
- `prisma/**`

## Regression Review

Confirm these are unchanged:

- Product list data.
- Movement list data.
- Current stock.
- Average cost.
- Tube quantity.
- Piece quantity.
- Default sale price.
- Product create/update/delete payloads.
- Import payload.
- Sale payload.
- Consumption/play usage payload.
- Adjustment payload.
- Other movement payload.
- Unit cost.
- Unit price.
- Total amount.
- Session relation.
- Created time.
- Product relation.
- Stock update formula.
- Weighted average cost formula.
- Tube-to-piece conversion.
- Piece-to-tube display conversion.
- Movement ordering.
- Query keys.
- Mutations.
- Cache invalidation.
- Permission gates.
- Validation messages from backend.

## Shared Component Guard

Confirm no shared UI component receives or introduces inventory calculation logic:

- no stock update formula
- no average cost formula
- no new rounding
- no persisted unit conversion
- no mutation payload building
