# BADMIN — AI GOVERNANCE ENTRYPOINT

Version: 2026-06-09

## Required Reading

Before implementing any feature, refactor, migration, optimization, or architecture-sensitive change:

1. Read `/docs/*`
2. Read `/rules/*`
3. Understand runtime scheduling philosophy
4. Understand operational finance and inventory philosophy
5. Preserve protected runtime systems
6. Preserve tablet/mobile-first UX
7. Preserve current-state runtime architecture

This project is still evolving. AI models must infer intent from the real implementation, preserve working behavior, and avoid unnecessary rewrites.

## Project Identity

Badmin is:

- realtime badminton club operation software
- live court orchestration inside a play session
- touch-first tablet/mobile runtime
- lightweight finance and shuttlecock inventory
- current-state persistence for recovery and synchronization

Badmin is not:

- ERP
- accounting ERP
- warehouse management
- tournament engine
- membership CRM
- global identity system
- CQRS
- event sourcing
- enterprise DDD

## Current Root Navigation

The root sidebar contains only:

- Dashboard
- Lịch chơi
- Thu chi
- Kho cầu
- Cài đặt

Realtime scheduling is not root navigation.

The runtime route is:

`/sessions/[sessionId]/runtime`

## Canonical Workflow

`Dashboard -> Lịch chơi -> Ngày chơi -> Ca chơi -> Điều phối`

Dashboard is business overview only. Điều phối is contextual runtime inside a Ca chơi.

## Session-Centric Architecture

The Play Session owns:

- players
- court count
- runtime courts
- runtime matches
- match history records
- payment status
- court cost
- shuttlecock usage
- session income, expense, and profit

Players are session-scoped only. Do not introduce global users, members, or persistent player accounts without explicit owner approval.

## Current-State Runtime Architecture

The database stores current operational snapshots for recovery:

- session metadata
- session players
- runtime courts by `court_number`
- runtime matches

Runtime persistence is not event sourcing, not CQRS, and not replay architecture.

Match history is allowed as a post-match lookup record created when an operator ends a match. It must not become the source of truth for live runtime state.

Runtime courts are generated from `play_sessions.court_count` when needed. Do not reintroduce a required physical court catalog unless explicitly requested.

## Operator-First Scheduling

The operator always has final authority.

AI/scheduling suggestions are advisory only. The operator must be able to:

- refresh suggestions
- apply or ignore suggestions
- replace suggested players
- cancel a ready court before start
- start and end matches manually
- open player list for review/payment control

The system must never force automatic matchmaking.

## Protected Runtime Lifecycle

The protected player lifecycle is:

`WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> JUST_FINISHED -> WAITING`

`JUST_FINISHED` is not cosmetic. It is a fairness, cooldown, fatigue, anti-repeat, and queue-continuity mechanic.

## Protected Runtime Modules

Protected areas include:

- `src/lib/badminton-store.ts`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- runtime hydration/sync hooks
- runtime repositories and `/api/runtime/snapshot`
- session completion logic
- shuttlecock inventory movement logic

Protected does not mean frozen. It means future AI models must not redesign these systems without explicit owner approval.

## Runtime DB Call Philosophy

Zustand owns live responsiveness and optimistic UI.

Database owns persistence and recovery.

Runtime must avoid continuous DB select/write loops. Commit to DB on meaningful operator actions such as refresh/apply/replace/start/end/cancel/save, not on temporary UI state or render cycles.

## Finance Philosophy

Finance is lightweight operational finance.

Manual finance transactions do not require a session. Generated completion transactions may reference a session.

Do not turn finance into accounting ERP.

Session profit must include court cost and shuttlecock usage cost even when settings disable automatic expense voucher creation.

## Inventory Philosophy

Shuttlecock inventory is lightweight operational stock tracking.

Current model:

- `shuttlecock_products`
- `shuttlecock_inventory`
- `shuttlecock_movements`

All stock changes must create a movement. Do not update inventory directly without a movement. Do not allow negative stock.

Do not turn inventory into warehouse ERP.

## Settings Philosophy

Current settings are simple browser-local operational preferences:

- auto-create court fee transaction
- auto-create shuttlecock usage transaction
- max court count per session

Do not add broad settings/admin systems without a clear operational need.

## Mobile / Tablet First

Primary runtime targets:

- tablet landscape
- smartphone portrait

Runtime UI must prioritize compact headers, large touch targets, fast action access, bounded scrolling, and low cognitive load.

## Forbidden Refactors

Future AI models must not autonomously introduce:

- event sourcing
- CQRS
- ERP architecture
- warehouse management
- global player systems
- tournament architecture
- mandatory auto-matchmaking
- runtime as root navigation
- continuous runtime DB write loops
- enterprise court identity/catalog as required runtime dependency

## Escalation Required

Ask the owner before changing:

- scheduling lifecycle
- `JUST_FINISHED` semantics
- next-match scoring philosophy
- replacement eligibility
- court lifecycle
- runtime DB sync strategy
- session completion finance/inventory behavior
- shuttlecock movement semantics
- session-scoped player architecture
- app navigation hierarchy

## Primary Goal

The goal is real-world badminton operational efficiency:

- operational simplicity
- fast live court orchestration
- stable session completion
- accurate lightweight finance
- accurate shuttlecock stock
- tablet/mobile usability

Not theoretical software perfection.
