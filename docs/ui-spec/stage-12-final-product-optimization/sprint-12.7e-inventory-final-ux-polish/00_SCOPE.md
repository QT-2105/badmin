# Sprint 12.7E Scope

## Objective

Final Inventory presentation polish before RC, focused on stock readability, tube/piece display, movement badge semantics, low/out stock presentation, table density and mobile/tablet scanability.

## In Scope

- Product summary and stock status presentation.
- Current stock quantity presentation using existing quantity data.
- Tube/piece display readability.
- Low-stock and out-of-stock badges.
- Average cost and usage cost readability.
- Movement quantity and movement type semantic presentation.
- Import, sale, consumption, adjustment and other movement badge audit.

## Out of Scope

- `current_stock` / `quantityBall` calculation.
- `average_cost` calculation.
- Movement calculation.
- Tube-to-piece conversion.
- Movement type semantics.
- API.
- Mutation.
- Payload.
- Validation.
- Query keys, cache invalidation, repository, service, database and Prisma.

## Capability Note

The source movement type for session consumption is `PLAY_USAGE`; this sprint documents it as the current consumption-equivalent presentation without renaming or changing stored values.

