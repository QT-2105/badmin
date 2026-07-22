# Protected Logic Map

## Global Protected Areas

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `prisma/**`
- `src/lib/badminton-store.ts`
- `src/lib/auth/**`
- business calculation helpers
- query/mutation hooks when behavior would change

## Runtime Protected Logic

Files:

- `src/lib/badminton-store.ts`
- `src/components/realtime-dashboard.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- runtime hooks/repositories/API

Protected functions/behavior:

- queue source/order
- player lifecycle
- `JUST_FINISHED`
- suggestion scoring
- replacement eligibility
- apply/start/end/swap/cancel
- runtime hydration/sync

## Finance Protected Logic

Protected:

- transaction type semantics
- deduction semantics
- category mapping
- quantity/unit price/total amount behavior
- totals
- report period and sorting
- API/repository/service/hook behavior

## Inventory Protected Logic

Protected:

- current stock
- average cost
- tube/piece conversion
- movement type semantics
- movement order
- no negative stock
- product and movement payloads

## Users And Permissions Protected Logic

Protected:

- auth provider
- session/token/cookie behavior
- role codes
- permission keys
- status values
- route guards
- server authorization
- API payloads and mutations

## Settings Protected Logic

Protected:

- setting keys
- localStorage persistence
- branding upload/delete behavior
- destructive service calls
- no fake settings for missing capabilities

