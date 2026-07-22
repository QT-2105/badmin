# Stage 11 Safety Contract

Stage 11 is presentation-only.

## Must Not Change

- Business logic.
- Runtime algorithms.
- Queue ordering.
- Pairing.
- Court assignment.
- Match lifecycle.
- Finance calculations.
- Revenue, expense and profit logic.
- Inventory calculations.
- `current_stock`.
- `average_cost`.
- Tube/piece conversion.
- API contracts.
- Database.
- Prisma.
- Repositories.
- Services.
- Zustand stores.
- React Query behavior.
- Query keys.
- Mutations.
- Cache invalidation.
- Payloads.
- Validation.
- Permissions.
- Routes.
- Authentication.
- Authorization.

## Required Escalation

If a UI change requires logic changes:

1. Do not implement it.
2. Record it as Out of Scope.
3. Name the file and function involved.
4. Describe the operational risk.
5. Stop the sprint if safe presentation-only work cannot continue.

## Shared Component Rule

Shared components may receive optional presentation props only when backward compatible.

Shared components must not contain:

- business calculations
- permission decisions
- route decisions
- data fetching
- mutations
- runtime scheduling state

