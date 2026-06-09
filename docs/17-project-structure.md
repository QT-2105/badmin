# Project Structure

Version: 2026-06-09

## App Router

- `src/app/page.tsx`: redirects to `/dashboard`
- `src/app/dashboard/page.tsx`: dashboard
- `src/app/schedule/page.tsx`: play dates
- `src/app/schedule/[playDateId]/page.tsx`: sessions in a date
- `src/app/sessions/page.tsx`: redirects to `/schedule`
- `src/app/sessions/[sessionId]/page.tsx`: session detail
- `src/app/sessions/[sessionId]/runtime/page.tsx`: live runtime
- `src/app/finance/page.tsx`: finance
- `src/app/inventory/page.tsx`: shuttlecock inventory
- `src/app/settings/page.tsx`: operational settings

## API Routes

- `/api/dashboard/summary`
- `/api/play-dates`
- `/api/play-dates/[id]`
- `/api/play-dates/[id]/sessions`
- `/api/sessions/[sessionId]`
- `/api/sessions/[sessionId]/players`
- `/api/sessions/[sessionId]/complete`
- `/api/session-players/[playerId]`
- `/api/runtime/snapshot`
- `/api/finance/transactions`
- `/api/inventory/products`
- `/api/inventory/products/[productId]`
- `/api/inventory/movements`

## Client Components

- `app-shell.tsx`: fixed sidebar/mobile nav
- `dashboard-page-client.tsx`: business overview
- `schedule-page-client.tsx`: play date list
- `play-date-detail-client.tsx`: session list/create/edit/delete
- `session-detail-client.tsx`: players, start, completion
- `realtime-dashboard.tsx`: runtime shell
- `live-courts-section.tsx`: court display
- `next-match-queue.tsx`: suggestion list
- `player-database-panel.tsx`: runtime player management
- `finance-page-client.tsx`: finance UI
- `inventory-page-client.tsx`: inventory UI
- `settings-page-client.tsx`: settings UI

## Data Layers

Pattern:

`UI -> hook -> service -> API route -> repository -> Prisma`

Runtime adds:

`Zustand -> commitRuntimeSnapshot -> API -> repository transaction`

Current hooks:

- `use-dashboard-summary.ts`
- `use-play-dates.ts`
- `use-session-players.ts`
- `use-runtime-hydration.ts`
- `use-runtime-snapshot.ts`
- `use-runtime-sync.ts`
- `use-finance.ts`
- `use-inventory.ts`
- `use-app-settings.ts`

Current repositories:

- dashboard
- finance
- inventory
- play dates
- play sessions
- runtime courts/matches/session/snapshot
- session players
- session completion

## Governance

- `/docs`: architecture truth layer
- `/rules`: machine-readable constraints
- `/prompts`: reusable AI workflows
