# Stage 04 - Schedule Management UX

Status: Planning / Audit only

Created: 2026-07-15

## Goal

Refine the Schedule Management UX for the operational flow:

`Lịch chơi -> Ngày chơi -> Ca chơi -> Chi tiết ca`

Stage 04 covers only:

1. Play Dates list page: `/schedule`
2. Play Date detail and Sessions list page: `/schedule/[playDateId]`

Stage 04 must make these screens feel consistent with the UI foundation and shared component system from Stage 01, Stage 01.5, Stage 02, and Stage 03.

## Non-Negotiable Constraints

Do not change:

- business logic
- API
- database
- Prisma
- repositories
- services
- business hooks
- React Query behavior
- Zustand state
- route names
- query parameters
- CRUD flow
- validation behavior
- permission checks
- play date data shape
- session data shape
- create/update/delete semantics for play dates
- create/update/delete semantics for sessions
- navigation to session detail
- runtime logic

Do not add:

- new feature
- new data source
- new business status
- new schedule workflow
- runtime redesign

## Source Files

Primary implementation files for future Stage 04 work:

- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`

Read-only dependency context:

- `src/hooks/use-play-dates.ts`
- `src/services/schedule-service.ts`
- `src/repositories/play-dates-repository.ts`
- `src/repositories/play-sessions-repository.ts`
- `src/types/domain.ts`
- `src/lib/date-format.ts`
- `src/lib/session-status.ts`
- `src/lib/auth/permissions.ts`

Route files:

- `src/app/schedule/page.tsx`
- `src/app/schedule/[playDateId]/page.tsx`

Explicitly out of scope:

- `src/components/schedule/session-detail-client.tsx`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- runtime APIs, repositories, stores, and synchronization logic

## Stage 04 Output

Stage 04 should end with:

- Schedule list UI refined using existing shared components where safe.
- Play Date detail/session list UI refined using existing shared components where safe.
- CRUD behavior unchanged.
- Permission behavior unchanged.
- Runtime untouched.
- Protected files unchanged.
- Validation passing.
- Completion report created.

## Required Stage 04 Sequence

1. Audit current Schedule source and document findings.
2. Lock information architecture without changing workflow.
3. Define visual specification.
4. Map existing UI to shared components.
5. Create an implementation plan.
6. Implement only after the plan is accepted.
