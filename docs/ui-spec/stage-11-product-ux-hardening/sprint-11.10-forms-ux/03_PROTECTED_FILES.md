# Sprint 11.10 — Protected Files

## Protected Areas

These areas were not modified by Sprint 11.10:

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/**`
- `src/lib/badminton-store.ts`
- `src/lib/auth/**`
- `src/lib/finance-calculation.ts`
- `src/lib/app-settings.ts`
- `src/types/domain.ts`
- `prisma/**`
- `middleware.ts`

## Protected Behavior

Sprint 11.10 preserves:

- Business logic.
- Runtime algorithms.
- Queue ordering.
- Pairing.
- Court assignment.
- Match lifecycle.
- Finance calculations.
- Inventory calculations.
- API contracts.
- Database and Prisma schema.
- Repository and service behavior.
- Zustand stores.
- React Query behavior.
- Query keys.
- Mutations.
- Cache invalidation.
- Payloads.
- Validation.
- Permissions.
- Routes.
- Authentication and authorization.

## Protected Diff Result

Command:

```bash
git diff --name-only -- src/app/api src/repositories src/services src/hooks src/lib/badminton-store.ts src/lib/auth src/lib/finance-calculation.ts src/lib/app-settings.ts src/types/domain.ts prisma middleware.ts
```

Result: PASS, no output.

