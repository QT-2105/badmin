# Stage 05 - Session Workspace

Status: Complete - PASS WITH NOTES

Created: 2026-07-15

Completion report: `08_COMPLETION_REPORT.md`

## Goal

Redesign the Session Workspace UI as a modern operational SaaS screen.

Session Workspace is the preparation screen between:

`Play Date -> Session -> Runtime`

It is where the operator prepares a play session before entering live court orchestration.

Stage 05 covers only the Session Workspace screen:

- `/sessions/[sessionId]`
- `src/components/schedule/session-detail-client.tsx`

Stage 05 must make the screen consistent with the UI foundation and shared component system from Stage 01, Stage 01.5, Stage 02, Stage 03, and Stage 04.

## Non-Negotiable Constraints

Do not change:

- business logic
- database
- Prisma
- repositories
- services
- API
- business hooks
- React Query behavior
- Zustand state
- runtime state
- payment logic
- finance calculations
- inventory calculations
- route names
- query parameters
- CRUD flow
- validation behavior
- permission checks
- session completion behavior
- player data shape
- session data shape
- runtime navigation route

Do not add:

- new feature
- new data source
- new business status
- new session workflow
- runtime redesign
- new completion calculation
- new payment model
- new inventory movement logic

## Source Files

Primary implementation file for future Stage 05 work:

- `src/components/schedule/session-detail-client.tsx`

Read-only dependency context:

- `src/app/sessions/[sessionId]/page.tsx`
- `src/hooks/use-session-detail.ts`
- `src/hooks/use-session-players.ts`
- `src/hooks/use-session-completion.ts`
- `src/hooks/use-play-dates.ts`
- `src/hooks/use-inventory.ts`
- `src/hooks/use-app-settings.ts`
- `src/services/session-service.ts`
- `src/services/schedule-service.ts`
- `src/services/inventory-service.ts`
- `src/repositories/play-sessions-repository.ts`
- `src/repositories/session-players-repository.ts`
- `src/repositories/shuttlecock-inventory-repository.ts`
- `src/types/domain.ts`
- `src/lib/session-status.ts`
- `src/lib/player-labels.ts`
- `src/lib/date-format.ts`
- `src/lib/auth/permissions.ts`

Explicitly out of scope:

- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- runtime APIs, repositories, stores, and synchronization logic
- finance API/repository/service logic
- inventory movement logic

## Stage 05 Output

Stage 05 should end with:

- Session Workspace UI refined using existing shared components where safe.
- Session header, preparation summary, completion info, notes, and player management presentation improved.
- Navigation to Runtime preserved.
- Completion controls preserved.
- Player add/edit/delete behavior unchanged.
- Payment semantics unchanged.
- Finance and inventory behavior unchanged.
- Runtime untouched.
- Protected files unchanged.
- Validation passing.
- Completion report created.

## Required Stage 05 Sequence

1. Audit current Session Workspace source and document findings.
2. Lock information architecture without changing workflow.
3. Define visual specification.
4. Map existing UI to shared components.
5. Create an implementation plan.
6. Implement only after the plan is accepted.
