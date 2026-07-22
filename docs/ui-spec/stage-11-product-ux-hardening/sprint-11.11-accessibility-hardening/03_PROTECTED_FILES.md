# Sprint 11.11 — Protected Files

## Protected Areas

Not modified:

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

## Protected Diff Command

```bash
git diff --name-only -- src/app/api src/repositories src/services src/hooks src/lib/badminton-store.ts src/lib/auth src/lib/finance-calculation.ts src/lib/app-settings.ts src/types/domain.ts prisma middleware.ts
```

Result: PASS, no output.

## Protected Behavior Confirmation

- Permission logic unchanged.
- Route behavior unchanged.
- Runtime lifecycle unchanged.
- Runtime pairing, queue ordering, court assignment, start/end, swap, and apply behavior unchanged.
- Finance calculations unchanged.
- Inventory calculations unchanged.
- API, repository, service, Prisma, and database unchanged.

