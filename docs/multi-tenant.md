# Multi-tenant architecture and migration

Version: 2026-09-07
Status: Phase 8F and Phase 14 UAT shadow complete; controlled Tenant #2 details pending

## Purpose

Badmin is evolving from one implicitly global club into the Tenant Application
of a SaaS platform. Each club is one Tenant. The existing application is the
implementation base; runtime, scheduling, completion, finance, inventory, and
tablet/mobile behavior are preserved unless a separately approved change says
otherwise.

This document is the canonical design and migration roadmap for that evolution.
It describes the target state and release gates. It does not authorize an
automatic schema change, production access, or onboarding of a second club.
The model-by-model Phase 2 contract, exact ownership boundaries, constraint
map, SQL sequence, repository/API mapping, and test matrix live in
[Multi-tenant schema and integration contract](./multi-tenant-schema-contract.md).
The Phase 3 control-table proposal, UAT confirmation gate, ownership grants,
Legacy seed, and read-only integration boundary live in
[Control foundation and Legacy Club](./multi-tenant-control-foundation.md).
Phase 3B/3C through Phase 11 are complete at their recorded boundary. Phase 12
and Phase 13 are complete on the confirmed UAT target. The
request-owned dynamic TenantContext, final Phase 8F application contract,
controlled login allowlist, and global-bootstrap retirement are also complete
locally. Phase 8F and the rollback-only shadow rehearsal are complete on UAT.
Tenant #2 remains inactive because this workspace has no controlled-club
registration, OWNER activation delivery, or separate Control Plane application.

## Scope and non-goals

The platform has two separately deployed applications using one PostgreSQL
database:

1. **Control Plane / System Manager** owns club registration, club lifecycle,
   plans, subscriptions, feature configuration, overrides, and system-level
   administration.
2. **Badmin / Tenant Application** owns each club's users, permissions,
   settings, play dates, sessions, runtime, completion, finance, inventory, and
   images.

The first migration does not introduce schema-per-club, database-per-club,
microservices, event sourcing, CQRS, a global player identity, a tournament
engine, or a replacement runtime. Existing operational tables should remain in
their current schema during the first migration; moving them to a new schema is
not required for tenant isolation.

## Original single-club baseline

The current application assumes every operational row belongs to one club:

- authentication resolves users globally by email;
- first-owner bootstrap checks the global user count;
- roles and permissions are global;
- settings and branding use the singleton key `default`;
- play dates are unique globally;
- repositories select, update, and delete tenant-owned entities by global ID or
  session ID without a tenant predicate;
- dashboard aggregates, image cleanup, and match-history reset are global;
- object-storage keys have no tenant namespace;
- runtime persistence is session-scoped, but not tenant-scoped.

This behavior remains valid only while there is one club. A second club must not
be onboarded until the isolation gates in this document pass.

## Target architecture

```text
Control Plane application                 Badmin application
registration, plans, billing              club operations
           |                                      |
           v                                      v
      control-owned data                 tenant-owned data
           |                                      |
           +--------------- PostgreSQL -----------+
                                  |
                         club_id on every
                         tenant-owned record
```

The recommended first target is:

- new control-plane tables live in a logical `control` schema;
- existing Badmin tables stay in their current schema and receive `club_id`;
- both applications use separate runtime DB roles;
- one migration authority owns reviewed schema changes for the shared database;
- cross-schema ownership is a contract, not permission for both applications to
  mutate every table.

### Tenancy decision

| Option | Benefit | Cost/risk | Decision |
| --- | --- | --- | --- |
| Shared tables with `club_id` | Preserves the current project and keeps deployment/reporting simple | Every tenant path must be scoped and tested | Selected |
| Schema per club | Stronger namespace separation | Prisma, migrations, reporting, and onboarding multiply per club | Rejected for the current scale |
| Database per club | Strongest physical isolation | High provisioning, migration, monitoring, and cost overhead | Deferred for exceptional future tenants |
| Rewrite or microservices | New boundaries can be designed from scratch | Highest regression risk and discards proven runtime behavior | Rejected |

The selected design deliberately pays for explicit row ownership rather than a
rewrite. `club_id` also preserves a future extraction path if a large or
contractually isolated tenant later requires a dedicated database.

### Database roles

| Role | Allowed responsibility |
| --- | --- |
| migration role | Reviewed, target-specific schema work only |
| control-plane role | Read/write control data and invoke the approved provisioning contract |
| Badmin application role | Read required club/entitlement projections and read/write tenant operational data |

Production applications must not use the migration role. Badmin must not edit
plans, subscriptions, promotions, billing state, or entitlement sources.

## Tenant identity and club code

`club.id UUID` is the canonical tenant identity. Club name, code, URL, username,
and session ID are never tenant identity.

`club.code` is a unique, human-facing locator for login, URLs, support, and club
selection. It is generated from a normalized club name. When a similar or equal
name already exists, registration warns the user and suggests a regional name.
If the user keeps the name, a short random numeric suffix makes the generated
code unique.

Club names may repeat. Club codes may not repeat. A code should become immutable
after activation; a later rename requires an explicit alias/redirect design.

The current club becomes Tenant #1 with one generated UUID and keeps all
existing data and effective capabilities. Application code must not hard-code
that UUID as permanent business logic.

## Data ownership

Every table must be classified before migration:

- `CONTROL_OWNED`: plan, subscription, registration, club lifecycle, system
  administration;
- `TENANT_OWNED`: operational data belonging to exactly one club;
- `GLOBAL_INTERNAL`: genuinely global infrastructure data with no club owner.

Do not add `club_id` blindly to control or global tables.

### Control-owned data

The Control Plane should own at least these concepts:

- clubs and registration requests;
- feature catalog;
- plans and immutable plan versions;
- subscriptions, trials, grace periods, and expiry;
- per-club feature overrides;
- effective entitlement snapshots and version;
- system administrators and sensitive control-plane audit records.

The exact billing provider and invoice model are Control Plane concerns, not
Badmin concerns.

### Tenant-owned data

The current Badmin models should be tenantized as follows:

| Area | Models | Required tenant change |
| --- | --- | --- |
| Access | `app_users`, `auth_sessions`, `app_role_permissions` | Add `club_id`; make identities, sessions, roles, and permissions tenant-scoped |
| Settings | `app_settings`, `payment_bank_accounts` | Replace the global singleton with one settings row per club; scope accounts and defaults |
| Schedule | `play_dates`, `play_sessions` | Add `club_id`; make play date unique per club; protect date/session relation |
| Session | `session_players`, `session_player_images` | Add `club_id`; protect player, image, and session ownership |
| Runtime | `runtime_courts`, `runtime_matches` | Add `club_id`; scope unique keys, hydration, revision, and snapshot writes |
| History | `match_histories`, `match_history_players` | Add `club_id`; preserve history creation only at match end |
| Completion | `session_summaries` | Add `club_id`; keep one summary per tenant session |
| Finance | `session_transactions` | Add `club_id`; keep `session_id` optional for manual finance |
| Inventory | `shuttlecock_products`, `shuttlecock_inventory`, `shuttlecock_movements` | Add `club_id`; protect product, stock, and movement consistency |

Fields or tables that do not exist in the current model are not added merely to
make the design look complete. A bank-account relation on transactions, a
session relation on movements, or new runtime reservation/snapshot tables each
require a separate domain decision.

## Database integrity

Application predicates are mandatory but are not sufficient. PostgreSQL must
also reject cross-tenant relations.

### Unique constraints

Values unique only inside a club use tenant composite uniqueness, including:

- `(club_id, play_date)`;
- `(club_id, role)`;
- `(club_id, username_normalized)`;
- `(club_id, email_normalized)` when email is present;
- `(club_id, phone_normalized)` when phone is present;
- `(club_id, session_id, court_number)`;
- `(club_id, session_id, queue_order)`;
- `(club_id, shuttlecock_product_id)` for current inventory.

Parent tables expose a unique `(club_id, id)` key where required by composite
foreign keys. Child relations include `club_id`, for example:

```text
play_sessions(club_id, play_date_id)
  -> play_dates(club_id, id)

session_players(club_id, session_id)
  -> play_sessions(club_id, id)

runtime_courts(club_id, session_id)
  -> play_sessions(club_id, id)

session_player_images(club_id, session_player_id)
  -> session_players(club_id, id)
```

Nullable relations remain nullable. Manual finance must not be forced to have a
session.

### JSON runtime roster limitation

Runtime teams are currently stored in JSON. PostgreSQL cannot enforce a foreign
key for player IDs inside those JSON values. Snapshot hydration and commit must
therefore validate that every referenced player:

- exists;
- belongs to the authenticated `club_id`;
- belongs to the same session;
- is unique within the roster and valid across active courts/previews.

Composite foreign keys do not replace this service-level validation.

### Index strategy

Tenant-owned query indexes normally begin with `club_id`, followed by the
existing filter or ordering fields. Priority examples are:

- play date and period;
- session status and play date;
- session player/session relation;
- runtime session, court number, queue order, and revision paths;
- finance period/session;
- product status and movement date;
- user login identifiers.

Index selection must follow real query plans after rollout. Do not duplicate
indexes mechanically when a composite constraint already provides the needed
access path.

## Request and repository contract

The authenticated request context is the sole application source for tenant
identity:

```text
TenantContext
  clubId
  clubCode
  clubStatus
  userId
  role
  permissions
  effectiveFeatures
  effectiveLimits
  entitlementVersion
```

The standard request flow is:

```text
authenticate session
-> establish TenantContext
-> validate URL club code when present
-> apply club-status policy
-> require user permission
-> require club entitlement when applicable
-> validate domain invariants
-> call tenant-scoped repository
-> rely on DB tenant constraints
```

Client-provided `club_id` is ignored or rejected. A resource ID belonging to a
different club should normally appear as not found so the API does not disclose
cross-tenant existence.

Tenant-owned repository functions accept TenantContext or a tenant-bound
repository. Global `findById(id)`, unscoped aggregates, bulk updates, and bulk
deletes are forbidden for tenant data. A transparent ORM extension is not the
only protection because nested writes, transactions, raw SQL, and JSON
references can bypass generic injection.

### Request flow before and after

```text
Current
cookie -> global user -> global role permission -> repository by id -> DB

Target
cookie -> user and club session -> TenantContext
       -> club status -> permission -> entitlement -> domain invariant
       -> tenant repository -> composite DB constraints
```

During compatibility releases, the same target flow runs with the server-side
Legacy Club context. This allows repository isolation to be proven before the
new club login and URL become customer-visible.

## Authentication and login

One application user belongs to exactly one club. Application users remain
separate from session players.

The login UI accepts:

1. selected club;
2. one login identifier;
3. password.

The public club lookup returns only active/login-visible club code and name. It
never exposes UUIDs, lifecycle internals, users, subscription details, or
operational data.

After the user selects a club, login performs:

```text
clubCode -> club UUID
-> check club login policy
-> classify and normalize identifier
-> find active user within club_id
-> verify password
-> create auth session containing user_id and club_id
-> redirect to /{clubCode}/dashboard
```

The generic failure message must not reveal whether an account exists in
another club. Login throttling should include IP, resolved club, and normalized
identifier.

### Login identifiers

The initial model should use nullable normalized username, email, and phone
columns on `app_users`. A separate `user_login_identifiers` table is deferred
until one user needs multiple aliases or multiple verified contacts.

To avoid ambiguity in one textbox:

- identifiers containing `@` are treated as email;
- valid normalized phone shapes are treated as phone;
- remaining identifiers are usernames;
- usernames may not resemble an email or a phone-only value.

Existing values are classified during backfill: email-shaped values retain
email login and non-email legacy login values become usernames. Password
hashes are never rewritten. Username remains optional because email or phone
may be the user's only identifier.

### Bootstrap replacement

Global first-owner bootstrap belonged to the original single-club baseline and
is retired in the local pre-Phase 14 release. New clubs are provisioned through
the idempotent Control Plane-to-Badmin contract. Provisioning creates club
settings, default role permissions, and the first OWNER through a time-limited
activation flow without moving a plaintext password between applications.

## Routes, caches, and client state

The target page route contains the club code:

```text
/{clubCode}/dashboard
/{clubCode}/schedule
/{clubCode}/sessions/{sessionId}
/{clubCode}/sessions/{sessionId}/runtime
```

API routes may remain resource-oriented because tenant identity comes from the
auth session. The page route code is a locator and must match the authenticated
tenant; it is not authorization.

Permission matching must normalize the pathname after removing the club-code
segment. Root navigation and the session-centric workflow otherwise remain
unchanged. One-user-one-club means Badmin needs no tenant switcher.

React Query keys, server caches, rate-limit keys, runtime state identity, and
any future realtime channel must include tenant context or be cleared on
logout. A user logging into another club in the same browser must never receive
cached data from the previous session.

## Runtime preservation

Tenant migration changes the runtime boundary, not the scheduler:

```text
runtime operation = club_id + session_id + required revision
```

Preserve all behavior in `docs/runtime.md` and `rules/runtime-semantics.yaml`,
including optimistic Zustand ownership, explicit meaningful-action commits,
operator authority, immediate post-match return to `WAITING`, Couple, wait
protection, one-shot `Trận kế`, End-Game, exact-quartet behavior, and current
formation rules.

Match history continues to be created when the operator ends a playing match.
Session completion must not take over that responsibility.

## Completion, finance, and inventory

Completion remains one transaction and preserves its current validations,
calculations, voucher options, `PLAY_USAGE` movement, stock update, player and
court finalization, runtime cleanup, summary, and session totals.

Tenant hardening adds:

- resolve and lock the session within `club_id`;
- resolve the shuttlecock product and inventory within the same club;
- write summary, transactions, movement, and updates with the same `club_id`;
- prevent a concurrent read-check-write race from making stock negative;
- preserve manual finance rows with nullable `session_id`;
- reject every cross-tenant relation before mutation.

Entitlement downgrade must not delete existing finance or inventory data and
must not strand a valid active session. A session that started under an allowed
capability remains operable and completable according to a documented policy.

## Settings and object storage

Operational settings become one DB-backed row per club. Personal theme and
sidebar preferences remain browser-local. Official registration/search name
belongs to the Control Plane; a Badmin branding display name may override it
for presentation without becoming tenant identity.

New object keys use a tenant namespace, for example:

```text
clubs/{clubId}/branding/...
clubs/{clubId}/payment-qr/...
clubs/{clubId}/players/...
```

Existing Legacy Club objects need not be physically moved during the first DB
migration. Their database rows establish ownership. Bulk deletion must select
the current tenant's stored keys; it must never list and delete a global prefix.
Object re-keying is an optional, separately reversible migration.

## Permission, entitlement, and domain invariants

These concepts remain separate:

- permission: whether the current user may perform the action;
- entitlement: whether the club's effective subscription enables the
  capability or limit;
- domain invariant: whether the operation is valid for badminton operations.

Badmin consumes effective feature keys and limits, never plan names. The
Control Plane combines plan version, subscription, promotion, expiry, and
override into a versioned effective snapshot.

Start with coarse module or capability keys. Never feature-flag tenant
validation, permission enforcement, revision safety, non-negative stock,
completion atomicity, duplicate-player protection, or another business safety
invariant.

Downgrade normally preserves historical reads, hides or disables unavailable
UI, and denies new backend mutations. It never deletes data or rewrites past
records. Quotas are deferred until a real package needs them; hard quotas must
use atomic counters or reservations rather than count-then-create.

## Club lifecycle and provisioning

A minimum lifecycle is:

```text
PROVISIONING -> ACTIVE -> GRACE_PERIOD/SUSPENDED -> ARCHIVED
```

Status policy is explicit per operation. A blanket `status != ACTIVE` rule must
not break safe reads or completion of an already active session.

Recommended provisioning flow:

1. Control Plane validates registration, proposes a canonical code, and treats
   the database unique constraint as the final concurrency authority.
2. It invokes the idempotent shared-DB contract with stable club/user/request
   IDs, effective entitlement values, and only an activation-token hash.
3. The transaction creates the `PROVISIONING` club, entitlement, settings,
   default role permissions, disabled OWNER, activation and receipt together.
4. Control Plane sends the club code and raw one-time activation link; it never
   generates or transports a password.
5. Badmin hashes the user-chosen password and token, verifies the entire seed,
   then changes OWNER, receipt, and finally club to `ACTIVE` atomically.
6. Failure remains retryable and must not create duplicate seed data; an
   unconsumed token may be rotated without reseeding.

The two applications may deploy independently. Provisioning and entitlement
contracts therefore require versioning and backward-compatible changes.

## Detailed migration roadmap

Each phase is separately reviewable. The owner may explicitly authorize a
bounded local-only test or documentation phase while an environment gate is
open; no implementation phase from Phase 3 onward may bypass Phase 0.

### Phase 0 - UAT safety and baseline

**Work**

- confirm Neon project, branch, database, role, pooled URL, and direct URL;
- record current schema drift without applying it automatically;
- back up the selected target and document recovery;
- isolate UAT storage and outbound integrations from production;
- capture aggregate-only row counts, auth/session state, finance, stock,
  runtime, settings, storage-reference, orphan, and anomaly baselines.

**Exit criteria**

- target and rollback owner are recorded;
- representative data reconciliation queries and reset procedure exist;
- no production credential is used by development automation.

**Rollback**

- no runtime behavior or schema has changed.

### Phase 1 - Regression safety net

**Work**

- lock current auth/permission behavior;
- lock schedule/session behavior;
- lock runtime persistence and readonly presentation behavior;
- lock completion, finance, and inventory behavior;
- lock settings, branding, payment bank accounts, history reset, and image
  deletion behavior;
- use local/mocked tests only while Phase 0 environment gates remain open.

**Exit criteria**

- critical current behavior has regression coverage;
- no test requires UAT DB/S3 mutation;
- lint, typecheck, tests, build, DB-automation guard, and diff checks pass.

**Rollback**

- tests and documents only; no production behavior or schema changed.

### Phase 2 - Schema and integration contract

**Work**

- classify every current model and required shared control structure;
- freeze `club_id`, unique, composite FK, index, nullable relation, query,
  migration-order, and rollback decisions;
- freeze TenantContext, authentication, club lifecycle/code, effective
  entitlement, provisioning, DB role, error, cache, and storage contracts;
- map every repository/API domain and define the isolation test matrix.

**Exit criteria**

- no current model is unclassified;
- no unsupported business table or field is introduced;
- Control Plane and Badmin ownership is explicit;
- the technical contract is synchronized with docs and rules.

**Rollback**

- documentation/rules only; Prisma, DB, and business source remain unchanged.

### Phase 3 - Control foundation and Legacy Club

**Execution status:** Phase 3A, 3B, and 3C completed on UAT on 2026-08-27. Its
original stop boundary was honored; Phase 4 was later started by a separate
explicit owner request.

**Work**

- Phase 3A: approve the exact `control.clubs`, effective-entitlement projection,
  capability seed, DB ownership, grant, rollback, and reconciliation proposal;
- Phase 3B, only after exact UAT confirmation: create the two control tables,
  create Tenant #1 with generated UUID/approved code, and seed all current
  capabilities;
- Phase 3C, only after migration reconciliation: add a non-enforcing,
  server-only read of club identity, status, and entitlement version;
- do not add tenant columns, change current auth/routes, or enforce entitlement.

**Exit criteria**

- Legacy Club is stable and referenced by migration configuration, not
  hard-coded application business logic;
- Badmin can read the club/status/effective-entitlement projection without
  being able to mutate control data or plan sources;
- current Badmin behavior and data reconciliation remain unchanged.

**Rollback**

- control rows can remain unused; existing Badmin behavior is unchanged.

### Phase 4 - Expand tenant columns

**Execution status:** Phase 4A, 4B, 4C, and 4D completed on confirmed UAT on
2026-08-27; stopped before Phase 5.

**Work**

- add nullable `club_id` columns to tenant-owned tables using reviewed manual
  SQL;
- add only the temporary indexes required for safe compatibility writes and
  backfill;
- do not replace global constraints or set `NOT NULL` yet;
- update the Prisma model only as required by the compatibility release.

**Exit criteria**

- old application behavior remains deployable;
- every target table and relation has an approved mapping.

**Rollback**

- application still ignores the new nullable columns; postpone dropping them
  until recovery is confirmed.

**Implementation evidence**

- all 18 existing Prisma models expose only optional UUID `club_id` scalars;
- four manual expand files and matching validation/rollback files are stored
  under `prisma/manual-migrations`;
- every column is nullable, has no default, and contains zero populated values;
- no existing primary key, unique constraint, FK, or index was replaced;
- no tenant constraint/index was introduced because Phase 4 preceded
  tenant-scoped queries and compatibility writes;
- pre/post relfilenodes are identical, confirming no table rewrite;
- UAT baseline and application regression remained unchanged at the end of
  Phase 4.

### Phase 5 - Compatibility tenant context and writes

**Execution status:** Phase 5A through Phase 5E completed on 2026-08-27;
stopped before Phase 6.

**Work**

- establish a temporary server-side Legacy TenantContext for current routes;
- ensure every new tenant-owned insert writes Legacy Club ID;
- ensure updates and deletes are prepared for tenant predicates;
- add observability for missing or unexpected tenant context;
- do not expose client-controlled tenant identity.

**Exit criteria**

- no newly created tenant-owned row has a null or unexpected club ID;
- Legacy Club users see unchanged behavior.

**Rollback**

- revert the compatibility application while retaining nullable schema; stop
  before backfill if writes cannot be proven complete.

**Implementation evidence**

- `BADMIN_LEGACY_CLUB_ID` is read only on the server, UUID-validated, immutable
  per operation, and fails closed with a structured missing-context log;
- all current create, nested-create, create-many, and upsert-create paths stamp
  Legacy Club ID across the 18 tenant-owned models;
- existing reads and update branches remain compatible with null legacy rows
  and do not perform an implicit partial backfill;
- the focused suite passes 97 tests and a static coverage guard checks the
  current insertion inventory;
- the UAT read-only monitor reports no positive null delta and no unexpected
  club IDs relative to the Phase 4 baseline;
- no login, URL, UI, entitlement enforcement, domain logic, DB constraint,
  index, or business-data mutation was introduced.

### Phase 6 - Backfill and reconciliation

**Execution status:** completed on confirmed UAT on 2026-08-28 after two
consistent reset-and-rerun rehearsals.

**Work**

- backfill parent and independent tables before children;
- batch large tables and avoid long locks;
- assign all existing operational rows to Legacy Club;
- validate null counts, orphan counts, parent/child tenant equality, record
  counts, finance totals, session totals, stock balances, runtime revisions,
  and image ownership;
- do not infer production contents from an empty beta database.

**Exit criteria**

- every tenant table has zero unexpected null `club_id` values;
- no relationship crosses tenant boundaries;
- operational totals match the pre-migration baseline.

**Rollback**

- nullable columns allow application rollback; restore from the confirmed
  backup if reconciliation changes original business data.

**Implementation evidence**

- a fingerprint-guarded, explicit-confirmation runner owns the table order,
  primary-key batch key, batch size, retry, validation, and ownership-only reset;
- 3,337 rows across all 18 tenant tables were processed in 23 batches;
- successful rehearsals took 12.22 and 13.38 seconds and returned identical
  row counts, business checksums, tenant ownership, and aggregate results;
- an immediate retry updated zero rows and preserved the final reconciliation;
- final state is zero null `club_id`, zero unexpected owner, zero orphan, zero
  tenant mismatch, zero inventory mismatch, and unchanged finance/runtime/
  settings/auth/storage aggregates;
- `club_id` remains nullable with no default; no tenant FK, composite FK,
  tenant unique/index, login, route, or domain change occurred.

### Phase 7 - Tenant application data access

**Work**

- 7A scopes users, active OWNER counts, role permissions, settings, bank
  accounts, branding, and auth sessions;
- 7B scopes play dates, sessions, players, summaries, and Couple operations;
- 7C scopes every dashboard count, aggregate, recent query, finance summary,
  and inventory summary;
- 7D scopes match history/reset and image mutations, and namespaces new logo,
  QR, and avatar objects under `clubs/{club_id}`;
- 7E scopes runtime hydration, courts, matches, snapshot revision, queue/court
  mutations, and JSON roster reference validation without scheduler changes;
- 7F scopes finance, products, inventory, movement, and completion without
  changing formulas or movement semantics.

**Exit criteria**

- no tenant-owned repository count, aggregate, read, update, delete, reset, or
  transaction path is global;
- a foreign-tenant identifier is indistinguishable from a missing resource;
- focused negative tests and the static data-access guard pass;
- Legacy Club regression, UAT ownership, and business reconciliation remain
  unchanged.

**Rollback**

- revert the application release only; Phase 7 performs no schema or business
  data migration and does not activate a second tenant.

**Implementation evidence**

- 20 tenant data-access source files require the server-owned Legacy
  TenantContext and pass the static query/mutation guard;
- all current API handlers continue through tenant-scoped repositories; no
  request field, header, query, or route can override `club_id`;
- destructive match-history and player-image operations affect only DB rows
  owned by the current club; bulk storage deletion uses tenant-owned DB
  references instead of a global S3 prefix scan;
- new storage objects are namespaced by club while existing Legacy Club object
  references remain readable and deletable;
- scheduler, runtime lifecycle, completion calculation, finance sign rules,
  stock movement, UI, login, and routes are unchanged.
- the full suite passes 158 tests and the read-only confirmed-UAT report keeps
  all 3,337 rows, finance, stock, runtime, settings, permission, storage, schema,
  and anomaly baselines unchanged.

### Phase 8 - Constraints and tenant indexes

**Work**

- add parent `(club_id, id)` unique keys where composite FKs require them;
- add and validate composite FKs;
- replace global business uniqueness with tenant uniqueness;
- set `club_id NOT NULL` only after validation;
- add measured tenant query indexes and retain rollback-compatible legacy
  constraints temporarily where required.

**Exit criteria**

- the DB rejects deliberate cross-tenant relations;
- query plans for critical Legacy Club flows remain acceptable;
- manual migration SQL and rollback steps are reviewed for the exact target.

**Rollback**

- remove only new constraints that block the compatibility application; do not
  erase backfilled ownership data during ordinary rollback.

**Implementation evidence (2026-08-28)**

- 8A-8E completed on confirmed UAT fingerprint `c2f96ce9dcd6`: 20 tenant
  query indexes, 23 tenant unique indexes, 18 direct club FKs, 16 composite
  FKs, and required `club_id` on all 18 tables;
- indexes were built concurrently; constraints were added `NOT VALID`,
  validated individually, and only then converted to `NOT NULL`;
- a rolled-back temporary-club probe proved the DB rejects a cross-tenant
  session/date relation; all 3,337 business rows and operational aggregates
  still match baseline;
- the auth-specific Phase 8F cutover later removed global
  `app_users_email_key`, after Phase 9 tenant identifier indexes were valid;
- the remaining date/runtime/history/inventory/settings global keys were
  removed on UAT on 2026-09-07. `app_settings` is keyed by `club_id`;
  readiness reports no blocker, and Tenant #2 is not activated.

Rollback order is fixed: make `club_id` nullable with the 8E rollback before
deploying any application that may omit it; drop Phase 8 FKs/checks with the
8C rollback; drop dependent tenant unique indexes with 8B; then drop optional
query indexes with 8A. The column-level Control Plane `REFERENCES` grant may be
revoked last. Ownership data is never cleared by this rollback.

### Phase 9 - Tenant-aware authentication and users

**Work**

- add normalized username, email, and phone fields according to the approved
  compatibility policy;
- scope users, active-owner checks, roles, permissions, and auth sessions by
  club;
- retain secure random tokens, hashed token storage, cookie attributes, and
  current role values;
- replace global bootstrap with the idempotent provisioning/activation path;
- update login throttling and generic failure messages.

**Exit criteria**

- identical email/username/phone values can exist in different clubs without
  ambiguity;
- a user authenticates only inside the selected club;
- disabling one club/user invalidates only its own access.

**Rollback**

- preserve existing email credentials and Legacy Club mapping; do not require a
  destructive password reset.

**Implementation evidence (2026-08-28)**

- Phase 9A-9E completed on UAT fingerprint `c2f96ce9dcd6`; five Legacy users
  were classified as usernames and retained their password hashes;
- `(club_id, username_normalized|email_normalized|phone_normalized)` unique
  indexes are valid and identifier checks are validated;
- sessions resolve by globally unique token hash, verify stored session/user
  club equality, and retain the existing secure cookie contract;
- club lookup exposes only `code` and `name`; login rate-limit keys hash the
  club/identifier input and generic errors do not disclose other-club users;
- legacy payload and `/dashboard` routing remain compatible through the Legacy
  Club redirect;
- non-Legacy login is fail-closed behind an explicit UUID allowlist;
- Phase 9F is complete locally: the global bootstrap endpoint is retired and
  returns `410` for creation. Deployment remains gated by Phase 13 UAT
  provisioning/activation acceptance. Tenant #2 remains inactive.

### Phase 10 - Tenant routes, caches, and storage

**Work**

- introduce `/{clubCode}` page routing with compatibility redirects;
- normalize permission matching after the tenant route segment;
- include tenant identity in query/cache/rate-limit keys and clear client state
  on logout;
- namespace new object-storage writes and make deletion DB-owned and
  tenant-scoped;
- keep old Legacy Club object keys readable until optional re-keying.

**Exit criteria**

- changing the URL code cannot change authorization;
- login/logout between test clubs cannot reuse prior cached data;
- image/logo/QR mutations affect only the authenticated club.

**Rollback**

- route redirects return Legacy Club to the old paths; old object keys remain
  valid.

**Implementation evidence (2026-08-28)**

- all operational pages exist under `/{clubCode}` and old application paths
  redirect using the club resolved from the authenticated session;
- a mismatched URL code returns not found and cannot select or override the
  authenticated tenant; permission matching uses the normalized domain path;
- operational React Query keys begin with the immutable club UUID, tenant
  routes own separate QueryClient instances, and logout clears tenant cache,
  runtime state, and current-tenant operational browser keys;
- new logo, QR, and avatar keys use `clubs/{clubId}/...`; existing DB-owned
  Legacy keys remain readable/deletable, and no bulk object move was run;
- APIs, repository tenant predicates, runtime scheduling, completion formulas,
  finance signs, inventory movement semantics, and DB data were not changed by
  this phase;
- At Phase 10, Phase 9F, non-Legacy login, and Tenant #2 remained gated. Later
  pre-Phase 14 status is recorded below.

### Phase 11 - Runtime, completion, finance, and inventory hardening

**Work**

- scope runtime hydrate/commit/revision by tenant and session;
- preserve current scheduler and lifecycle semantics;
- make completion and inventory concurrency-safe within one transaction;
- verify all generated finance, movement, summary, and runtime cleanup rows use
  one tenant;
- preserve completion after an allowed session has started, according to club
  status and entitlement policy.

**Exit criteria**

- runtime isolation and revision-conflict tests pass with two tenants;
- concurrent completion/inventory tests cannot make stock negative or duplicate
  finalization;
- finance and profit reconciliation matches the baseline.

**Rollback**

- rollback only tenant-boundary changes; never restore old scheduling or
  completion semantics through a migration shortcut.

**Implementation evidence (2026-09-04)**

- runtime writes require the explicit hydrated revision and claim only the
  matching LIVE tenant session; stale, missing, inactive, completed, and
  cancelled writes fail before snapshot mutation;
- runtime JSON rosters are validated against the current tenant session on
  hydration and commit, including unique-player and cross-position checks;
- completion claims LIVE once and advances runtime revision before any
  generated finance, movement, stock, summary, or finalization write;
- completion and every inventory mutation serialize through the same tenant
  product row lock, preventing stale read/check/write overwrites;
- deterministic concurrent tests prove one of two completion attempts creates
  side effects and a completion/manual-output race cannot make stock negative
  or duplicate movement/transactions;
- all 185 tests, lint, typecheck, production build, Prisma/YAML validation,
  tenant read/write guards, no-schema-automation guard, runtime-hardening
  guard, and diff check pass; scheduler, lifecycle, finance formulas, voucher
  behavior, and movement semantics are unchanged;
- no schema change, UAT data mutation, or automatic migration was performed.

### Phase 12 - Entitlement enforcement

**Work**

- consume effective feature keys and limits from the Control Plane projection;
- add one shared backend feature guard and corresponding frontend presentation;
- define read, create, active-operation, and completion behavior for each club
  status and feature downgrade;
- use entitlement version and validity when caching;
- keep quotas out until their atomic semantics are designed.

**Exit criteria**

- plan names do not appear in Badmin business branching;
- direct URL and direct API calls cannot bypass feature guards;
- Legacy Club retains every current capability;
- downgrade never deletes data or strands active runtime.

**Rollback**

- fail safely to the last known valid effective snapshot for the documented
  window; do not silently grant an unknown capability forever.

**Implementation evidence (2026-09-04)**

- Badmin reads the versioned effective `features`, `limits`, `valid_until`, and
  club lifecycle projection only; no commercial plan/subscription fields or
  Control Plane mutation were added;
- one shared backend guard enforces permission, then entitlement, before the
  existing repository/domain invariant; direct API calls cannot rely on hidden
  navigation alone;
- tenant pages and sidebar presentation use the same eight capability keys;
  unknown/missing keys are denied and limits remain read-only;
- disabled, expired, suspended, archived, and provisioning projections deny
  ordinary module access without deleting or rewriting existing data;
- runtime/session/completion endpoints allow a narrowly scoped continuation
  only when the referenced session belongs to the authenticated club and is
  still `LIVE`; this includes minimal completion dependencies such as product
  options, never inventory mutations. New schedules and inactive sessions
  receive no exception;
- projection cache identity includes club UUID, version, and validity. A live
  projection is refreshed after 15 seconds; a read outage may use the last
  unexpired projection for no more than two minutes;
- Legacy Club's seeded projection contains all eight current capabilities and
  entitlement regression verifies the complete set;
- reviewed manual grant/validation/rollback SQL expands `badmin_uat_app` read
  access to the projection columns. It was not applied automatically or
  against an unconfirmed target;
- 195 regression tests, lint, typecheck, production build, Prisma/YAML
  validation, tenant/runtime/schema guards, the entitlement enforcement guard,
  and diff check pass locally.

### Phase 13 - Provisioning

**Work**

- Control Plane owns registration, duplicate-name warning, canonical code
  suggestions, unique-code retry, service authentication, and email delivery;
- one reviewed shared-DB function atomically creates a `PROVISIONING` club,
  effective entitlement, settings, default role rows, disabled OWNER, hashed
  activation token, and idempotency receipt;
- registration email prominently displays the immutable club code and sends an
  activation link, never a generated/plaintext password;
- Badmin exposes only OWNER activation. The browser reads the token from the
  URL fragment and removes it from browser history; the server persists only
  token/password hashes;
- activation verifies the full seed and changes the club to `ACTIVE` last;
- Control Plane can rotate an unused activation token for delivery failure,
  expiry, or loss without reseeding the club.

**Exit criteria**

- an identical retry returns one club, entitlement, settings row, three
  configurable role rows, one OWNER, one receipt, and one activation row;
- reuse of an idempotency key with another payload is rejected;
- activation retry is stable and club status cannot become `ACTIVE` unless all
  seed invariants and OWNER activation succeed;
- no plaintext password enters Control Plane, email, receipt, log, or DB call;
- reviewed UAT rollback-only rehearsal leaves no synthetic residue.

**Rollback**

- keep onboarding and non-Legacy login disabled; do not roll the role-permission
  key back after a provisioned tenant exists. The supplied rollback refuses to
  run while any provisioning receipt remains.

**Implementation evidence (2026-09-05)**

- registration/code/email contract, OWNER activation API/UI, hash-only
  repository boundary, tenant-scoped role-permission key proposal, manual SQL,
  validation/guarded rollback, static guard, focused tests, and a
  fingerprint-confirmed rollback-only UAT rehearsal runner are implemented;
- migration, least-privilege validation, idempotent activation rehearsal,
  forced rollback, zero-residue proof, and Legacy reconciliation passed on UAT
  fingerprint `c2f96ce9dcd6` on 2026-09-07. Email transport remains a Control
  Plane responsibility;
- the request-owned AsyncLocalStorage TenantContext is established only from
  authenticated session data; a mismatch fails closed, and the Legacy fallback
  requires an explicit compatibility flag;
- remaining global-key cutover SQL, controlled non-Legacy login allowlist, and
  global-bootstrap retirement are implemented locally;
- 208 tests, lint, typecheck, production build, Prisma/YAML validation, and all
  runtime/entitlement/provisioning/tenant/schema-automation guards pass;
- non-Legacy customer onboarding and Tenant #2 remain disabled. Phase 14 has
  not started operationally.

### Phase 14 - Controlled Tenant #2 release

**Work**

- run the fingerprint-guarded read-only readiness audit;
- run the confirmed-UAT shadow rehearsal inside a forced-rollback transaction;
- confirm all release gates and production target details;
- onboard one controlled club;
- monitor DB load, query latency, error rate, isolation alerts, completion,
  stock, and auth failures;
- expand onboarding gradually after the controlled observation window.

**Exit criteria**

- both clubs operate independently with correct totals and no cross-tenant
  visibility;
- rollback and support procedures have been exercised.

**Rollback**

- suspend new onboarding without deleting Tenant #2 data; preserve safe read,
  support, export, and active-session completion according to policy.

**Execution evidence (2026-09-07)**

- `audit:phase14-readiness` checks tenant NOT NULL/constraints, remaining
  global keys, tenant-owned singleton keys, Control Plane/Badmin grants,
  Legacy baseline ownership, auth-session consistency, runtime-role binding,
  and blocking locks using a read-only transaction;
- `phase14:shadow` provisions and activates a synthetic tenant, proves
  cross-tenant duplicate identifiers/dates and composite-FK rejection, then
  forces rollback and checks for residue;
- readiness reports `ready: true` with no blocker;
- the forced-rollback shadow passed provisioning idempotency, cross-club
  duplicate identifier/date, composite-FK rejection, OWNER activation, and
  zero-residue checks;
- the shadow was repeated using `badmin_control_writer` for provisioning and
  `badmin_uat_app` for activation and operational writes;
- the UAT connection authenticates as `neondb_owner` and assumes
  `badmin_uat_app` on the unpooled application connection. The effective role
  has CRUD on all 18 public tenant tables and cannot mutate Control Plane rows;
- release-candidate validation passes 211 tests, lint, typecheck, Prisma
  validation, production build, all guards, health/public-club smoke tests, and
  a production dependency audit with zero vulnerabilities;
- a real Tenant #2 remains pending because controlled-club identity, OWNER
  details, secure activation delivery, and the separate Control Plane project
  are not available in this workspace.

### Phase 15 - Optional defense and scale work

Only after application isolation is stable:

- pilot PostgreSQL RLS with Prisma/Neon pooling tests and a non-owner runtime
  role;
- introduce distributed throttling or cache only when multi-instance operation
  requires it;
- add atomic quotas when commercial packages require measurable limits;
- build tenant export, retention, restore, or large-tenant extraction tooling;
- consider partitioning or database-per-tenant only from measured scale or
  contractual isolation needs.

RLS is defense in depth, not a repair for missing tenant predicates.

## Test matrix

Before Tenant #2, automated tests must prove at least:

1. user A cannot authenticate against club B;
2. token A plus URL code B is rejected;
3. body/query/header club B cannot override token A;
4. every resource lookup for B through A is not found;
5. dashboard, finance, inventory, users, settings, and history aggregates are
   isolated;
6. child A cannot reference parent B at DB level;
7. runtime JSON cannot reference player B;
8. runtime cache and revision streams do not collide;
9. completion A cannot use product, inventory, session, or settings B;
10. destructive reset and object deletion affect only A;
11. duplicate login identifiers across A and B remain unambiguous;
12. downgrade/suspension A does not affect B;
13. provisioning retry is idempotent;
14. current runtime, finance, inventory, and completion regression suites still
    pass for Legacy Club.

## Release gates

Tenant #2 remains disabled until all of these are true:

- every tenant-owned table has validated non-null `club_id`;
- every tenant relation has an application check and appropriate DB constraint;
- no tenant-owned global read, aggregate, update, or delete remains;
- authentication and auth sessions bind one user to one club;
- settings, permissions, caches, and object storage are tenant-safe;
- runtime revisions are mandatory and tenant-scoped;
- completion and inventory concurrency hardening passes;
- Legacy Club data counts, finance totals, stock, runtime, and permissions are
  reconciled;
- repository/API isolation tests cover all operational domains;
- reviewed SQL, exact environment target, backup, recovery, and rollback are
  owner-approved;
- required quality gates in `rules/release-readiness.yaml` pass.

## Trade-offs and residual risks

Shared-table tenancy is the smallest safe evolution of the current project and
keeps deployment and reporting simple. Its primary risk is an omitted tenant
predicate, so application context, composite constraints, tests, and later RLS
must work together.

One shared database also means a large club may become a noisy neighbor and
single-tenant restore is harder than database-per-tenant. Tenant-first indexes,
structured metrics, exports, and `club_id` on every operational record preserve
a later extraction path without paying that operational cost today.

The migration increases query and schema complexity, especially for compound
keys and nullable historical relations. That cost is preferable to a rewrite
because it preserves the project's proven operational behavior and lets each
phase be validated and rolled back before another club is exposed.

### Risk register

| Risk | Primary control |
| --- | --- |
| Omitted tenant predicate | Mandatory TenantContext, repository boundary, negative tests, composite constraints, optional later RLS |
| Cross-tenant ID or JSON reference | Tenant-aware lookup plus service validation of runtime roster IDs |
| New null rows during backfill | Deploy compatibility writes before backfill and constraints |
| Big-bang rollback failure | One reviewable expand/contract release per phase |
| Settings, permission, or aggregate remains global | Domain-by-domain repository inventory and isolation tests |
| Browser/server cache leaks between logins | Tenant cache keys and tenant-sensitive state clearing on logout |
| Global object-prefix deletion | DB-owned tenant key selection and tenant namespace for new writes |
| Inventory or completion race | Transactional lock/atomic conditional update and concurrency tests |
| Subscription expiry breaks active runtime | Explicit club-status and active-operation continuation policy |
| Two projects apply conflicting schema changes | One migration authority, separate DB roles, versioned contracts |
| Large tenant affects others | Tenant-first indexes, measured query/load metrics, later extraction path |
| Single-tenant restore is difficult | Tenant export/reconciliation tooling before contractual restore guarantees |
