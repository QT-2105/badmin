# Protected Logic Map

## Runtime

Protected files:

- `src/lib/badminton-store.ts`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- `src/hooks/use-runtime-*.ts`
- `src/repositories/runtime-*.ts`
- `src/app/api/runtime/snapshot/route.ts`

Protected behavior:

- player lifecycle
- queue source and order
- suggestion scoring
- replacement eligibility
- court lifecycle
- match start/end
- sync/hydration

## Finance

Protected files:

- `src/repositories/finance-repository.ts`
- `src/app/api/finance/transactions/route.ts`
- finance service/hooks/types/helpers

Protected behavior:

- transaction semantics
- deduction semantics
- totals
- categories
- report period
- sorting
- manual transaction independence from session

## Inventory

Protected files:

- `src/repositories/inventory-repository.ts`
- `src/app/api/inventory/**`
- inventory service/hooks/types/helpers

Protected behavior:

- stock movements
- no negative stock
- weighted average cost
- tube/piece conversion
- movement ordering
- movement payloads

## Auth And Permissions

Protected files:

- `middleware.ts`
- `src/app/api/auth/**`
- `src/lib/auth/**`
- `src/hooks/use-auth.ts`
- auth repositories and services
- `prisma/**`

Protected behavior:

- authentication provider
- session/token/cookie behavior
- role codes
- permission keys
- route guards
- server authorization

## General

Protected files:

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `prisma/**`
- business hooks when handler/data contracts would change

