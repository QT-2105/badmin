# Sprint 11.5 — Protected Files

No changes are allowed in:

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/**`
- `src/lib/badminton-store.ts`
- `src/lib/auth/**`
- `src/types/domain.ts`
- `prisma/**`
- `middleware.ts`
- Runtime hydration/sync logic.
- Finance calculation helpers.
- Inventory calculation and movement helpers.
- Permission and authorization logic.

## Runtime Protected Contracts

The sprint must preserve:

- Queue source and ordering.
- Pairing mode semantics.
- Suggested match generation.
- Selected player IDs.
- Court assignment.
- Start/end match handlers.
- Swap handler.
- Apply handler.
- Match history source.
- Runtime store actions.
