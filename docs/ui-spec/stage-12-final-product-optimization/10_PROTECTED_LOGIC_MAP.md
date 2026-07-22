# Stage 12 Protected Logic Map

## Protected Backend/Logic Files

Do not edit in Stage 12 unless separately approved:

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

## Protected Presentation Files

These files may be visually touched only with explicit Stage 12 allowed-file scope and regression evidence:

- `src/components/app-shell.tsx`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- `src/components/finance/finance-page-client.tsx`
- `src/components/inventory/inventory-page-client.tsx`
- `src/components/dashboard/dashboard-page-client.tsx`
- `src/components/schedule/session-detail-client.tsx`

## Protected Semantics

| Area | Must preserve |
| --- | --- |
| Runtime | queue source/order, lifecycle, pairing, replacement, apply/start/end/cancel/swap, hydration/sync. |
| Schedule | play date/session CRUD rules, route flow, past-date restrictions. |
| Session completion | court cost, shuttlecock usage, profit, completion lock, generated finance/inventory side effects. |
| Finance | transaction semantics, categories, deductions, totals, report period and sort behavior. |
| Inventory | movement model, no negative stock, current stock, average cost, tube conversion. |
| Auth/users | auth provider, sessions, roles, permissions, status values, server authorization. |
| Settings | local preference storage and existing handlers. |
| App shell | root nav labels/targets and no global runtime nav. |

## Protected Diff Command

```bash
git diff --name-only -- src/app/api src/repositories src/services src/hooks src/lib/badminton-store.ts src/lib/auth src/lib/finance-calculation.ts src/lib/app-settings.ts src/types/domain.ts prisma middleware.ts
```

Expected result during Stage 12:

- no output
