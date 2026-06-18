# Runtime Audit Prompt

Use this prompt to audit the current realtime scheduling runtime.

```text
Read AGENTS.md, /docs/*, and /rules/*.

Inspect:
- src/lib/badminton-store.ts
- src/components/realtime-dashboard.tsx
- src/components/sections/live-courts-section.tsx
- src/components/sections/next-match-queue.tsx
- src/components/sections/player-database-panel.tsx
- src/components/sections/match-history-panel.tsx
- src/components/cards/court-card.tsx
- src/components/cards/next-match-card.tsx
- src/hooks/use-runtime-hydration.ts
- src/hooks/use-runtime-sync.ts
- src/repositories/runtime-snapshot-repository.ts
- src/repositories/runtime-courts-repository.ts
- src/repositories/runtime-matches-repository.ts

Verify:
- WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> JUST_FINISHED -> WAITING
- scheduling disabled when session not ACTIVE, readonly, or insufficient players
- minimum players = court_count * 6
- courts generated from court_count when snapshot rows are missing
- no duplicate players across suggestions/courts
- PLAYING players cannot be replacement candidates
- ready court cancellation returns players to WAITING
- start requires READY and four slots
- end moves players to JUST_FINISHED and clears court
- ending a match records lookup history without becoming runtime source of truth
- refresh suggestions commits snapshot only by explicit action
- tablet and mobile runtime access remain usable

Do not redesign runtime.
Return concrete findings and safe fixes only.
```
