# Sprint 11.6 — Protected Files

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

Protected contracts:

- Runtime queue ordering, pairing, court assignment, match lifecycle, Zustand state, apply handler, and start/end handler.
- Finance calculations, sort/filter, pagination, entry payloads, and transaction semantics.
- Inventory stock calculation, movement ordering, quantity conversion, movement payloads, and product payloads.
- User permission/security behavior, role/status values, auth/session behavior, and protected routes.
- Settings config keys, local persistence behavior, and save/reset semantics.
