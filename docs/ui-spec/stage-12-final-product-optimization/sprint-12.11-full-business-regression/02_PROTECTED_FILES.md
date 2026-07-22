# Protected Files

## Runtime

- `src/lib/badminton-store.ts`
- `src/components/realtime-dashboard.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/hooks/use-runtime-sync.ts`
- `src/hooks/use-runtime-hydration.ts`
- `src/app/api/runtime/**`

## Finance

- `src/lib/finance-calculation.ts`
- `src/app/api/finance/**`
- finance repositories and services
- finance hooks and mutation contracts

## Inventory

- inventory repositories and services
- `src/app/api/inventory/**`
- inventory movement creation payloads
- stock and average-cost calculation code

## Users and Settings

- `src/lib/auth/**`
- `src/hooks/use-auth.ts`
- `src/hooks/use-app-settings.ts`
- `src/hooks/use-branding.ts`
- `src/lib/app-settings.ts`
- `src/app/api/auth/**`
- `src/app/api/settings/**`
- `middleware.ts`

## Global

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/**`
- `src/types/domain.ts`
- `prisma/**`

## Protected Contracts

- Business logic.
- Runtime algorithms.
- Queue ordering.
- Pairing.
- Court assignment.
- Match lifecycle.
- Finance calculations.
- Inventory calculations.
- `current_stock`.
- `average_cost`.
- API contracts.
- Query keys.
- Mutations.
- Payloads.
- Validation.
- Permissions.
- Routes.
