# Data and operations

Version: 2026-09-04

## Database boundary

PostgreSQL stores operational current state, recovery snapshots, finance, stock,
authentication, permissions, and shared settings. The Prisma schema defines the
application data model.

The current UAT target may contain a controlled copy of production data for
migration rehearsal. It remains a non-production environment, but its copied
data is sensitive and must not be exposed as raw PII, credentials, tokens, or
object keys in diagnostics. UAT must not share mutable production storage,
email, webhook, or other outbound integrations. Never infer current production
state from UAT because the copy is point-in-time.

`DATABASE_URL` is the application connection and may be pooled.
`DATABASE_URL_UNPOOLED` is the direct administrative connection. Confirm the
target before every DB-sensitive operation.

On the confirmed UAT target, `BADMIN_RUNTIME_DB_ROLE=badmin_uat_app` makes the
application use the unpooled URL and assume the reviewed effective runtime role;
Neon pooled connections reject the PostgreSQL startup `role` option. Production
must use a separate least-privilege LOGIN in the pooled `DATABASE_URL` instead
of carrying the migration-owner credential into runtime.

Drift inspection is read-only. Schema changes use owner-reviewed,
target-specific SQL under `prisma/manual-migrations`. Application startup,
Docker, CI, and automated validation must never apply schema changes.

Phase 0 baseline diagnostics must run inside a read-only transaction and only
after the Neon project, branch, database, and role have been explicitly mapped
to the configured target fingerprint. Aggregated counts are allowed; raw user
records, password/session hashes, and object keys are not baseline output.

## Effective entitlement projection

Badmin reads only `club_id`, `version`, `features`, `limits`,
`valid_until`, and projection update time from
`control.club_entitlements`, together with the club identity/status. The
runtime role has no entitlement mutation permission. Recognized feature keys
are `dashboard`, `schedule`, `session.runtime`, `session.completion`,
`finance`, `inventory`, `users`, and `settings`.

Every protected API evaluates permission first and effective entitlement
second; repository domain rules remain the final check. Page and navigation
presentation mirror the same feature keys, but backend enforcement is
authoritative. Limits are normalized and exposed read-only; no quota is
enforced until its atomic counter semantics are designed.

An expired projection or inactive club denies ordinary module use. Existing
data remains untouched. Runtime, session operations required by the current
workflow, and completion may continue only for a tenant-owned `LIVE` session.
The completion flow may read its minimal product options and operational
settings/bank projections under that same session-bound continuation; it does
not gain inventory-management mutations.
The last successfully read projection may be used during a Control Plane read
failure for at most two minutes, only while its own `valid_until` is still
valid. Cache identity includes club UUID, entitlement version, and validity.
Successful projections are reused for at most 15 seconds before the Control
Plane is read again.

## Approved tenant data boundary

The Multi-Tenant target uses one shared PostgreSQL database. Every
tenant-owned operational row is owned by a server-established `club_id`.
Application queries require tenant predicates, and cross-tenant parent/child
relations require composite database constraints. Client input and URL codes
are not sources of tenant authorization.

Existing Badmin tables remain in their current schema during the first
migration. New Control Plane tables may use a logical `control` schema. One
migration authority coordinates both projects. The complete expand/write/
backfill/constrain/application-switch sequence is defined in
[Multi-tenant architecture and migration](./multi-tenant.md); the exact
model/constraint/repository/API contract is defined in
[Multi-tenant schema and integration contract](./multi-tenant-schema-contract.md).

## Session status and completion

UI status maps to the current database vocabulary:

- `PENDING -> NOT_STARTED`
- `ACTIVE -> LIVE`
- `COMPLETED -> FINISHED`
- `CANCELLED` remains readonly when present

Starting requires at least four players. Court count limits runtime capacity; it
is not a six-players-per-court admission rule.

Completion transactionally:

- validates court cost, shuttlecock product/usage, and available stock;
- records paid slot income;
- optionally creates court/shuttlecock expense vouchers according to settings;
- always creates a `PLAY_USAGE` movement and decrements stock;
- finishes players, empties courts, removes runtime matches, and finishes the
  session;
- stores income, expense, and profit.

The completion transaction first claims the tenant session only while it is
LIVE. This makes completion retry-safe: only one concurrent request can create
generated transactions, `PLAY_USAGE`, summary, and final session totals.

Profit always subtracts court and shuttlecock usage costs even when automatic
expense vouchers are disabled. Optional extra-expense voucher creation is
strictly opt-in per completion; the extra cost still affects profit.

## Finance

Finance is lightweight operational finance. Manual transactions need no
session; generated completion transactions may reference one.

Valid transaction types are `INCOME` and `EXPENSE`; adjustment types are
`NORMAL` and `DEDUCTION`. Quantity must be positive, monetary inputs
non-negative, and title/category required. Deductions use positive amounts with
deduction semantics, not negative money.

Manual categories are Slot, Cầu, Sân, and Khác. Reports filter by month/year and
support newest/oldest ordering. Do not introduce accounting-ledger behavior.

## Shuttlecock inventory

Inventory uses products, one current stock record, and immutable movements:
`IMPORT`, `SALE`, `PLAY_USAGE`, `ADJUSTMENT`, and `OTHER`.

Every stock change must create a movement and update inventory in the same
transaction. Negative stock and direct movement-less inventory updates are
forbidden. Weighted cost and usage price remain per-ball operational values.

All product update/delete, manual movement, and session-completion stock paths
serialize on the same tenant product row before reading current inventory.
Calculations and validation therefore use the latest committed quantity and a
concurrent output cannot overwrite another output or make stock negative.

## Dashboard, settings, and users

Dashboard is period-based business overview only; it must not host live
scheduling.

Shared operational settings stay small and DB-backed. The application contract
uses one singleton per club, keyed by server-owned `club_id`:

- automatic court-fee voucher;
- automatic shuttlecock-usage voucher;
- maximum courts per session;
- default payment bank account.

Collection settings such as payment accounts use dedicated rows. Personal theme
and sidebar preferences may remain browser-local.

Application users, auth sessions, roles, and permissions are distinct from
session players. Preserve route/API permission semantics and the roles `OWNER`,
`MANAGER`, `OPERATOR`, and `VIEWER`. Global first-owner bootstrap is retired in
the local pre-Phase 14 release; that release may be deployed only after the
approved idempotent per-club provisioning and activation package passes UAT.
