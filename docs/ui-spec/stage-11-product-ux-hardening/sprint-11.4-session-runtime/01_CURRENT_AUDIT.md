# Sprint 11.4 Current Audit

Targets:

- `src/components/schedule/session-detail-client.tsx`
- `src/components/realtime-dashboard.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/sections/match-history-panel.tsx`

Known issues:

- Runtime remains the highest-risk area for tablet UX.
- Runtime leave protection uses native confirm and is safety-sensitive.
- Several runtime controls use dense layout by design.

