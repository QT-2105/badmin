# Analyze Project Prompt

Use this prompt when an AI model must understand the current Badmin repository before proposing work.

```text
Read AGENTS.md first.

Then read /docs/* and /rules/*.

Analyze the current implementation, focusing on:
- src/app routes and API routes
- src/components/app-shell.tsx
- src/components/dashboard/dashboard-page-client.tsx
- src/components/schedule/*
- src/components/realtime-dashboard.tsx
- src/components/sections/live-courts-section.tsx
- src/components/sections/next-match-queue.tsx
- src/components/sections/player-database-panel.tsx
- src/components/cards/court-card.tsx
- src/components/cards/next-match-card.tsx
- src/lib/badminton-store.ts
- src/lib/session-status.ts
- src/lib/app-settings.ts
- src/hooks/*
- src/services/*
- src/repositories/*
- prisma/schema.prisma

Report the real current architecture:
- root navigation: Dashboard, Lịch chơi, Thu chi, Kho cầu, Cài đặt
- runtime route: /sessions/[sessionId]/runtime only
- session-centric player model
- current-state runtime snapshot model
- court generation from play_sessions.court_count and court_number
- next-match suggestion/replacement flow
- session completion finance/inventory flow
- shuttlecock product/inventory/movement model
- browser-local settings
- tablet/mobile runtime UX

Do not implement.
Do not regenerate governance unless asked.
Do not propose enterprise architecture.
```
