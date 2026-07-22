# Protected Logic Map

## Protected Files

Do not edit without separate approval:

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

## Protected Runtime Areas

- runtime hydration and synchronization
- queue source and ordering
- player lifecycle: `WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> JUST_FINISHED -> WAITING`
- pairing and replacement logic
- apply/start/end/cancel/swap behavior
- court assignment and current match references
- match history source

## Protected Finance Areas

- revenue, expense and profit calculations
- transaction type/category semantics
- deduction semantics
- quantity, unit price, total amount behavior
- report period and sort behavior
- transaction payloads and mutations

## Protected Inventory Areas

- movement semantics
- no negative stock
- stock update formula
- weighted average cost
- tube/piece conversion
- movement order
- product and movement payloads

## Protected Auth/Settings Areas

- authentication provider
- session/cookie/token behavior
- role codes and permission keys
- server authorization
- route guards
- local settings storage keys and semantics
- destructive service behavior

## Required Protected Diff Check

```bash
git diff --name-only -- src/app/api src/repositories src/services src/hooks src/lib/badminton-store.ts src/lib/auth src/lib/finance-calculation.ts src/lib/app-settings.ts src/types/domain.ts prisma middleware.ts
```

Expected result:

- no output

