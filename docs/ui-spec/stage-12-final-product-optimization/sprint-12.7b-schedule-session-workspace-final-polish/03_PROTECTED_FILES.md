# Sprint 12.7B Protected Files

## Protected Backend / Data / Logic

- `src/app/api/**`
- `src/hooks/**`
- `src/repositories/**`
- `src/services/**`
- `src/lib/auth/**`
- `src/lib/badminton-store.ts`
- `src/lib/finance-calculation.ts`
- `src/lib/app-settings.ts`
- `src/types/domain.ts`
- `prisma/**`
- `middleware.ts`

## Protected Runtime

- `src/components/realtime-dashboard.tsx`
- `src/components/sections/**`
- `src/components/cards/**`

## Protected Functions / Contracts

- `submit`, `requestRemovePlayDate`, `confirmRemovePlayDate`.
- `submit`, `beginEditSession`, `saveEditSession`, `requestRemoveSession`, `confirmRemoveSession`.
- `submitPlayer`, `beginEdit`, `saveInlineEdit`, `setStatus`, `validateCompletion`, `updateCompletionDraft`, `confirmCompleteSession`.
- `normalizePlayerForm`, `getPaymentEditValue`, `withPaymentEditValue`.
- Hook calls, query keys, mutation payloads, route hrefs and permission checks.

