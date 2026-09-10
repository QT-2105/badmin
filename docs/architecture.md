# Architecture

Version: 2026-08-25

## Product boundary

Badmin is a session-centric badminton operations application for play-date
planning, live court orchestration, session completion, lightweight finance,
shuttlecock inventory, and permission-guarded administration.

It is not an ERP, accounting ledger, warehouse system, tournament engine,
membership CRM, global player identity system, CQRS system, or event-sourced
runtime.

The root navigation is:

1. Dashboard
2. Lịch chơi
3. Thu chi
4. Kho cầu
5. Người dùng
6. Cài đặt

`Người dùng` manages application access and remains separate from
session-scoped players. Realtime scheduling is contextual and exists only at
`/sessions/[sessionId]/runtime`.

The operational workflow is:

`Dashboard -> Lịch chơi -> Ngày chơi -> Ca chơi -> Điều phối`

## Approved SaaS evolution

Badmin will evolve incrementally into the Tenant Application of a two-project
SaaS platform. One club is one Tenant; the separate Control Plane owns club
lifecycle, plans, subscriptions, and effective entitlement. Both applications
use one PostgreSQL database with explicit ownership and separate runtime roles.

The current project remains the implementation base. Tenant migration adds
server-owned TenantContext, `club_id` isolation, database constraints, and
effective feature enforcement around existing behavior. It does not authorize
a runtime rewrite, global player model, or broad administration platform inside
Badmin. See [Multi-tenant architecture and migration](./multi-tenant.md).

Until the relevant migration phases pass their gates, current routes and the
single-club data model remain the implemented state; the target document must
not be read as current capability.

Effective entitlement is a read-only, versioned Control Plane projection. The
Tenant Application recognizes capability keys only; it never branches on plan,
promotion, subscription, or billing names. Permission, entitlement, and domain
validation remain separate checks. A downgrade denies new disallowed use and
does not delete tenant data. A tenant-owned `LIVE` session may continue its
runtime and completion path so an entitlement/status change cannot strand it.

## Domain ownership

A Play Session owns its players, court count, runtime courts and matches, match
history, payments, completion costs, shuttlecock usage, income, expense, and
profit.

Key boundaries:

- session players are not global users or members;
- runtime courts derive from `play_sessions.court_count` and persist by
  `court_number`;
- match history is a post-match lookup record, not live runtime truth;
- manual finance may exist without a session;
- shared operational settings are DB-backed; personal theme/sidebar preferences
  may use browser storage.

## Runtime and data flow

Zustand owns immediate, optimistic runtime behavior. PostgreSQL owns durable
current state and recovery.

`UI -> hook/service -> API -> repository -> Prisma`

Runtime adds:

`Zustand -> commitRuntimeSnapshot -> API -> repository transaction`

Hydration loads the session, session players, runtime courts, and runtime
matches. Missing court rows are derived from the session court count. Snapshot
writes happen after meaningful operator actions, never from render cycles,
temporary selections, candidate generation, or continuous polling.

The database stores current snapshots, not an event stream. Recovery after
refresh or browser reopen hydrates the newest snapshot; it never replays runtime
events.

## Architecture decisions

| Decision | Reason |
| --- | --- |
| Runtime stays inside a Play Session | Keeps live operation in its real context |
| Persist current state, not events | Recovery is required; replay architecture is not |
| Derive courts from `court_count` | A physical court catalog is not currently required |
| Keep suggestions beside court management | Courts and upcoming matches are one workflow |
| Commit runtime snapshots explicitly | Preserves responsiveness and limits DB traffic |
| Record every stock change as a movement | Keeps stock and operational history consistent |
| Always include court and shuttlecock cost in profit | Voucher settings do not change session economics |
| Separate shared DB settings from personal UI preferences | Avoids a broad settings platform |
| Separate application users from session players | Access control is not club membership |
| Shared-table tenancy with `club_id` | Smallest safe evolution of the current project |
| Keep plans and subscriptions in the Control Plane | Badmin consumes effective capabilities, not commercial package logic |
| Isolate beta and production databases | Development must not affect real data |

Current source and `prisma/schema.prisma` are authoritative for file layout,
routes, APIs, models, and field names. Do not maintain drift-prone inventories
of every source file in documentation.
