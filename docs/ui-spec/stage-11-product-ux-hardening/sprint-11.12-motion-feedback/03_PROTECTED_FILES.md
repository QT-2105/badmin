# Sprint 11.12 — Protected Files

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

## Protected Timing

Not modified:

- Countdown timing.
- Match timer intervals.
- Runtime refresh behavior.
- React Query retry configuration.
- Auth retry behavior.
- Runtime cooldown timing.

## Protected Diff Result

Command:

```bash
git diff --name-only -- src/app/api src/repositories src/services src/hooks src/lib/badminton-store.ts src/lib/auth src/lib/finance-calculation.ts src/lib/app-settings.ts src/types/domain.ts prisma middleware.ts
```

Result: PASS, no output.

