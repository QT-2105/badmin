# Multi-tenant schema and integration contract

Version: 2026-08-28
Status: Phase 2 design complete; Phase 6 UAT backfill complete

## Scope and authority

This document freezes the technical contract required before tenant columns,
Prisma relations, SQL migrations, authentication, or tenant routes are changed.
It is derived from the current Prisma schema, repositories, API routes, auth
session flow, React Query usage, and S3 repositories.

Phase 2 changes documentation and rules only. It does not authorize a database
connection, SQL application, Prisma edit, business-logic change, second-club
activation, or Control Plane implementation inside Badmin.

The following boundaries are fixed:

- one club is one tenant;
- `control.clubs.id` UUID is tenant identity;
- `club.code` is a human locator, never authorization;
- one Badmin user belongs to exactly one club;
- all 18 current Prisma models are `TENANT_OWNED`;
- no current Prisma model is `CONTROL_OWNED` or `GLOBAL_INTERNAL`;
- session players remain session-scoped and separate from application users;
- the current scheduler, runtime lifecycle, completion formulas, finance, and
  inventory semantics are unchanged.

## Shared database ownership

### Control Plane contract

The separate Control Plane owns the `control` schema. The minimum shared
structures are limited to business requirements already approved:

| Structure | Required columns | Purpose |
| --- | --- | --- |
| `control.clubs` | `id uuid PK`, `code varchar UNIQUE`, `name varchar`, `status varchar`, `created_at`, `updated_at` | Canonical club identity and lifecycle |
| `control.feature_catalog` | `key varchar PK`, `value_kind varchar`, `active boolean` | Stable capabilities or limits understood by both applications |
| `control.plan_versions` | `id uuid PK`, `plan_key varchar`, `version int`, `status varchar`, effective timestamps | Immutable commercial package version |
| `control.plan_version_features` | `plan_version_id`, `feature_key`, `enabled`, nullable typed limit value | Package capability source |
| `control.club_subscriptions` | `id uuid PK`, `club_id`, `plan_version_id`, `status`, start/end/grace timestamps | Current trial/subscription source |
| `control.club_feature_overrides` | `id uuid PK`, `club_id`, `feature_key`, enabled or limit override, validity timestamps | Explicit per-club adjustment |
| `control.club_entitlements` | `club_id PK`, `version bigint`, `features jsonb`, `limits jsonb`, `valid_until`, `updated_at` | Versioned effective projection read by Badmin |

`features` is a key-to-boolean object and `limits` is a key-to-number/string
object. Badmin branches only on these stable keys. It never joins plan,
subscription, promotion, or billing names into operational decisions.

All seven structures above are `CONTROL_OWNED`. `clubs.name` is not unique;
`clubs.code` is unique. Plan versions are unique by `(plan_key, version)` and
cannot be edited after activation. Plan features are unique by
`(plan_version_id, feature_key)`. Subscriptions, overrides, and entitlement
projections reference `control.clubs`; plan features and overrides reference
the feature catalog. Control Plane transactionally permits only one current
entitlement-producing subscription per club. Status/value-kind checks use
reviewed PostgreSQL constraints rather than adding Prisma-only assumptions.

Invoices, payment-provider records, promotions, Control Plane users, and
Control Plane audit storage remain private Control Plane design. Badmin has no
foreign key or code dependency on those internal tables, so Phase 2 does not
invent their schema.

### Provisioning receipt and OWNER activation

Idempotent provisioning uses two narrow technical tables in `control`:

```text
club_provisioning_receipts
  idempotency_key uuid primary key
  request_fingerprint char(64) not null
  club_id uuid not null unique
  owner_user_id uuid not null unique
  status varchar not null        // READY_FOR_OWNER | ACTIVE
  created_at timestamp not null
  updated_at timestamp not null

club_owner_activations
  club_id uuid primary key
  owner_user_id uuid not null unique
  token_hash char(64) not null unique
  expires_at timestamp not null
  activated_at timestamp null
```

They exist only for deterministic seed/activation retry. Neither stores a raw
activation token or password and neither becomes a workflow engine, email
outbox, or event store. Direct table writes are denied to Badmin runtime;
transitions occur only through reviewed `SECURITY DEFINER` functions.

### Database roles

| Role | Grants |
| --- | --- |
| Migration role | DDL and reviewed data migration in `control` and the current Badmin schema |
| Control Plane runtime role | CRUD its commercial sources and execute tenant provisioning/token reissue functions; no direct CRUD on Badmin operational tables |
| Badmin runtime role | Read the club/entitlement projection, CRUD authenticated tenant operational data, and execute OWNER activation only; no direct provisioning-table or commercial-source mutation |

The Control Plane calls the versioned internal Badmin provisioning contract; it
does not seed Badmin tables directly. Production applications never receive the
migration role. One migration authority coordinates reviewed SQL for the
shared database.

## Club contract

### Club code

- Store one canonical lowercase ASCII code containing letters, digits, and
  single hyphens; remove Vietnamese diacritics and collapse whitespace/symbols.
- Club names may repeat; canonical club codes may not repeat.
- Registration warns on equal/similar names and suggests a region-qualified
  name. If the name is retained, code generation appends a short random numeric
  suffix and retries the database unique constraint.
- Code generation is server-side. A uniqueness check is advisory; the unique
  constraint is authoritative under concurrency.
- Code becomes immutable at `ACTIVE`. Rename changes the official name only.
  Alias/redirect support is deferred and no `searchable` field is introduced.

### Club status policy

| Status | Login | Read | New mutations | Existing LIVE session |
| --- | --- | --- | --- | --- |
| `PROVISIONING` | Denied except internal activation flow | Internal only | Provisioning seed only | Not applicable |
| `ACTIVE` | Allowed | Allowed by permission/entitlement | Allowed by permission/entitlement/domain rules | Operate and complete |
| `GRACE_PERIOD` | Allowed | Allowed | Same effective entitlement during the bounded grace window | Operate and complete |
| `SUSPENDED` | New login denied | Existing authenticated safe reads only | Denied | Existing LIVE session may be operated and completed; no new session starts |
| `ARCHIVED` | Denied | No normal Badmin access | Denied | Must have no LIVE session before archival |

Suspension and downgrade never delete data. Archival is a lifecycle state, not
a cascade delete. Control Plane must refuse archival while a session is LIVE.

## TenantContext and authentication

The server establishes this immutable request context after resolving the
hashed auth-session token:

```text
TenantContext
  clubId: UUID
  clubCode: string
  clubStatus: ClubStatus
  userId: UUID
  role: OWNER | MANAGER | OPERATOR | VIEWER
  permissions: PermissionKey[]
  effectiveFeatures: readonly feature-key set
  effectiveLimits: readonly key/value map
  entitlementVersion: bigint
  entitlementValidUntil: timestamp | null
```

Resolution order is fixed:

```text
auth token -> auth_sessions(club_id, user_id)
-> app_users(club_id, id) and control.clubs(id)
-> app_role_permissions(club_id, role)
-> control.club_entitlements(club_id)
-> TenantContext
```

The request body, query, header, resource ID, or URL code cannot replace the
session-bound club ID. A URL club code must equal `TenantContext.clubCode`.

### User identifiers

`app_users` has nullable `username`, `username_normalized`, `email`,
`email_normalized`, `phone`, and `phone_normalized`. At least one normalized
identifier is required. Backfill classifies legacy values: email-shaped values
populate normalized email, while non-email values populate username. Current
UAT contained five non-email legacy values. Password hashes are untouched.

Uniqueness is per club:

- `(club_id, username_normalized)` when username exists;
- `(club_id, email_normalized)` when email exists;
- `(club_id, phone_normalized)` when phone exists.

Email-like input is email, a valid normalized phone shape is phone, and the
remainder is username. Username creation rejects email-like or phone-only
values. A separate `user_login_identifiers` table is not added because the
current requirement is one value per identifier type, not multiple aliases.

Login accepts selected club, one identifier, and password. After club
selection, every missing, disabled, wrong-password, or other-club user returns
the same `401` message:

```text
Tài khoản đăng nhập không hợp lệ hoặc không thuộc CLB {clubName}, vui lòng kiểm tra lại.
```

Rate limiting keys include IP, resolved club UUID, identifier type, and a hash
of the normalized identifier. Raw identifiers are not used in logs or metric
labels. Auth sessions retain global-unique token hashes and existing cookie
security, while also storing `club_id` and using a composite user FK.

## Current model ownership and query map

All current models are `TENANT_OWNED`. `club_id` is nullable only during the
expand/backfill compatibility window and is `NOT NULL` before Tenant #2.

| Model | Current query use | Target tenant ownership |
| --- | --- | --- |
| `play_dates` | date list/detail/create/update/delete; dashboard period counts | Direct club owner; date unique inside club |
| `play_sessions` | date sessions, detail/status/update/delete, dashboard, completion, runtime resolution | Direct club owner; date parent and optional shuttlecock product must share club |
| `runtime_courts` | hydrate/generate/upsert/delete current courts | Club plus session; optional runtime match must share club and session |
| `runtime_matches` | hydrate queue/courts, snapshot replacement/cleanup | Club plus session; queue and court slots unique inside tenant session |
| `session_players` | session CRUD, Couple, runtime hydration, payment/completion | Club plus session; no global player identity or name uniqueness |
| `app_settings` | operational settings and branding singleton | Exactly one row per club; current `id='default'` is transitional only |
| `payment_bank_accounts` | active list/order/create/delete/default | Club collection; default settings relation stays nullable |
| `app_users` | login, bootstrap, user/owner management | Exactly one club per user; identifiers unique only within club |
| `auth_sessions` | token resolution/create/logout/expiry cleanup | Club-bound session and composite user relation; token hash remains globally unique |
| `session_player_images` | avatar history/status and bulk deletion | Club plus session player; stored keys selected from DB ownership |
| `app_role_permissions` | list/get/upsert permissions by role | One permission row per `(club_id, role)` |
| `match_histories` | session/player-filtered history and reset | Club plus session; remains post-match lookup only |
| `match_history_players` | history participants and player filtering | Club plus history/player; service validates same session |
| `session_summaries` | player-count refresh and completion summary | One summary per club session |
| `session_transactions` | period/session finance, manual and generated writes | Direct club owner; `session_id` intentionally nullable |
| `shuttlecock_inventory` | current stock/value and transactional updates | One stock row per club product |
| `shuttlecock_movements` | period/product movement history and stock mutation | Direct club owner plus product; movements remain mandatory |
| `shuttlecock_products` | list/options/create/update/delete/dashboard | Direct club owner; product names remain non-unique |

## Constraint and index map

Every tenant table has a direct FK `club_id -> control.clubs(id)` with
`ON DELETE RESTRICT`. Referenced tenant parents expose `UNIQUE (club_id, id)`.
The list below defines additional domain constraints; it does not authorize SQL
application.

| Model | Target unique/primary contract | Composite FK contract | Query-driven indexes | Nullable relation |
| --- | --- | --- | --- | --- |
| `play_dates` | `UNIQUE(club_id, play_date)`, `UNIQUE(club_id,id)` | club only | `(club_id, play_date DESC)` | none |
| `play_sessions` | `UNIQUE(club_id,id)` | `(club_id,play_date_id)->play_dates`; optional `(club_id,shuttlecock_product_id)->products` | `(club_id,play_date_id,start_time)`, `(club_id,status)` | shuttlecock product remains nullable |
| `runtime_matches` | `UNIQUE(club_id,id)`, `UNIQUE(club_id,session_id,queue_order)`, `UNIQUE(club_id,session_id,court_number)` | `(club_id,session_id)->play_sessions` | `(club_id,session_id,status)`; unique keys serve queue/court lookup | queue and court remain nullable |
| `runtime_courts` | `UNIQUE(club_id,session_id,court_number)` | `(club_id,session_id)->play_sessions`; optional `(club_id,session_id,runtime_match_id)->runtime_matches(club_id,session_id,id)` | unique key serves hydration | runtime match remains nullable |
| `session_players` | `UNIQUE(club_id,id)` | `(club_id,session_id)->play_sessions` | `(club_id,session_id)`, `(club_id,session_id,couple_number)` | Couple fields and runtime metadata remain nullable |
| `app_settings` | target `PRIMARY KEY(club_id)` after compatibility; legacy `id` is removed only after repository cutover | optional `(club_id,default_payment_bank_account_id)->payment_bank_accounts` | primary key only | default account and branding objects remain nullable |
| `payment_bank_accounts` | `UNIQUE(club_id,id)` | club only | `(club_id,active,display_order,created_at)` | none in current model |
| `app_users` | `UNIQUE(club_id,id)` plus three nullable identifier unique keys | club only | `(club_id,role,status,created_at)` | username/email/phone are nullable but at least one is required |
| `auth_sessions` | global `UNIQUE(token_hash)`; `UNIQUE(club_id,id)` | `(club_id,user_id)->app_users` | `(club_id,user_id)`, `(expires_at)` | none |
| `session_player_images` | `UNIQUE(club_id,id)` | `(club_id,session_player_id)->session_players` | `(club_id,session_player_id)`, `(club_id,status)` | metadata fields remain nullable |
| `app_role_permissions` | `PRIMARY KEY(club_id,role)` | club only | primary key only | none |
| `match_histories` | `UNIQUE(club_id,id)` | `(club_id,session_id)->play_sessions` | `(club_id,session_id,ended_at DESC)`, `(club_id,session_id,court_number)` | start/duration remain nullable |
| `match_history_players` | `UNIQUE(club_id,match_history_id,session_player_id)` | `(club_id,match_history_id)->histories`; `(club_id,session_player_id)->players` | `(club_id,session_player_id)` | none |
| `session_summaries` | `UNIQUE(club_id,session_id)` | `(club_id,session_id)->play_sessions` | unique key serves lookup | none |
| `session_transactions` | `UNIQUE(club_id,id)` | optional `(club_id,session_id)->play_sessions` | `(club_id,created_at DESC)`, `(club_id,session_id,created_at)` | `session_id` remains nullable |
| `shuttlecock_products` | `UNIQUE(club_id,id)` | club only | `(club_id,status,created_at)`, `(club_id,name)` for option ordering | brand remains nullable |
| `shuttlecock_inventory` | `UNIQUE(club_id,shuttlecock_product_id)` | `(club_id,shuttlecock_product_id)->products` | unique key serves stock lookup | none |
| `shuttlecock_movements` | `UNIQUE(club_id,id)` | `(club_id,shuttlecock_product_id)->products` | `(club_id,created_at DESC)`, `(club_id,shuttlecock_product_id,created_at DESC)` | price/title/note fields retain current nullability |

PostgreSQL cannot validate player IDs stored in `runtime_matches.team_a` and
`team_b` JSON. Snapshot hydration/commit must validate club, session,
existence, uniqueness, and court/preview conflicts in application code.
`match_history_players` similarly requires a service check that the player and
history belong to the same session; adding a redundant `session_id` field is
not justified by current business behavior.

## Repository contract

Repository functions handling tenant data accept `TenantContext` or a
tenant-bound repository. The preferred incremental signature is
`operation(context, input)`; a generic Prisma extension is not sufficient.

| Repository group | Required target change |
| --- | --- |
| play dates/sessions | Add club predicate to every list/detail/duplicate check/create/update/delete; validate date and optional product in the same club |
| session players/Couple | Resolve session/player/Couple by club; scope counts, summary refresh, runtime-reference checks, and multi-row updates |
| runtime session/courts/matches/snapshot | Identity is `(club_id,session_id,required_revision)`; scope hydration, recent quartets, cleanup, compare-and-swap, and every transaction write |
| match history | Scope list/create/reset; validate all four players against the same tenant session; reset only current club |
| completion | Resolve and lock tenant session/settings/product/inventory; stamp one club on summary/finance/movement/runtime cleanup; preserve current calculations |
| finance/dashboard | Scope all period/session aggregates and manual rows; nullable session still requires the transaction's club |
| inventory | Scope product/options/movement/stock reads and mutations; protect concurrent stock updates separately in the hardening phase |
| app settings/branding/bank accounts | Replace `id='default'` lookups with club singleton lookup; default account must match club; display order is per club |
| player images | Resolve players by club, namespace new keys, and bulk-delete only DB-selected keys for that club; never list a global prefix |
| users/role permissions | Scope user/owner counts, identifiers, invalidation, and role rows; global bootstrap is removed only by provisioning cutover |
| auth sessions | Create/resolve/destroy with stored club binding; expiry cleanup must not become an unsafe unscoped tenant mutation |

Every cross-tenant resource ID is handled exactly like a missing ID. No
repository may fetch globally and compare `club_id` after returning data to the
caller; the tenant predicate belongs in the database query itself.

## API contract and mapping

All existing permission names and domain validation remain unchanged. Tenant
context is inserted before the current permission check.

| API group | Current routes | Target contract |
| --- | --- | --- |
| Public club selection | new Control Plane public lookup | Return only login-visible `code`, `name`, optional region presentation; never users, status internals, plans, or entitlements |
| Auth/bootstrap | `/api/auth/login`, `/logout`, `/me`, `/bootstrap` | Login resolves selected club then identifier; session stores club; global bootstrap is disabled after provisioning cutover |
| Users/roles | `/api/auth/users/**`, `/api/auth/role-permissions` | TenantContext then current `users.manage`; active-owner protection and role configuration are per club |
| Dashboard | `/api/dashboard/summary` | TenantContext, current permission, tenant aggregates |
| Schedule/session | `/api/play-dates/**`, `/api/sessions/**`, player/Couple routes | TenantContext, URL code match when applicable, current permission, tenant resource lookup |
| Runtime/history | `/api/runtime/snapshot`, session history, global reset route | Tenant-scoped revision and roster validation; reset becomes current-club reset |
| Completion | `/api/sessions/[sessionId]/complete` | TenantContext, status/entitlement continuation policy, permission, one-tenant transaction |
| Finance/inventory | `/api/finance/**`, `/api/inventory/**` | TenantContext before current permission; all lists, aggregates, and mutations scoped |
| Settings/branding/banks/images | `/api/settings/**` | Even current unauthenticated GET routes require authenticated TenantContext; public club lookup must not depend on Badmin branding endpoints |
| Health | `/api/health` | Remains process-global and carries no tenant data |

Target page routes use `/{clubCode}/...`. API resource paths may stay unchanged
because the auth session is authoritative. Path permission matching removes
the validated club-code segment before using the existing permission map.

### Error response

To preserve current clients, the target API keeps the current `error` string
and may add stable `code` and `requestId` fields:

```json
{
  "error": "Không tìm thấy dữ liệu yêu cầu.",
  "code": "RESOURCE_NOT_FOUND",
  "requestId": "safe-correlation-id"
}
```

- missing and cross-tenant resource IDs return the identical `404` envelope;
- URL club code mismatch returns the same non-disclosing `404`;
- invalid login returns the generic club-specific `401` message above;
- suspended/archived policy returns `403` with a stable lifecycle code only
  after authentication, without revealing another club's data;
- missing entitlement returns `403 FEATURE_NOT_AVAILABLE`;
- clients never receive an owner club ID, plan source, or cross-tenant detail.

## Effective entitlement contract

The Control Plane computes and atomically replaces one effective projection per
club whenever plan version, subscription status, expiry, or override changes.
Projection `version` increases monotonically. A missing or expired projection
denies entitlement-controlled new mutations while allowing only the documented
safe-read and already-LIVE-session continuation policy; it never grants all
features by default.

Badmin behavior is:

1. load the projection while establishing TenantContext;
2. cache by `(club_id, entitlement_version)` no longer than `valid_until`;
3. check permission, entitlement, and domain invariant separately;
4. preserve historical reads on downgrade;
5. deny new disallowed mutations;
6. allow an already LIVE session to operate and complete;
7. never default an unknown/expired projection to every feature forever.

Feature keys start at coarse current modules or actions. Tenant isolation,
permissions, revision safety, completion atomicity, non-negative stock, and
duplicate-player validation are invariants and cannot be disabled by a plan.

## Provisioning contract

Control Plane calls the reviewed shared-DB function with service
authentication. The idempotency UUID is a separate function argument; the
canonical JSON object contains:

```text
club_id, club_code, club_name, owner_user_id
owner_username/email/phone and their normalized values
owner_display_name
features, limits, entitlement_valid_until
activation_token_hash, activation_expires_at
```

The registration service generates club/user/request IDs and the random
activation token. Only its SHA-256 hash enters the DB call; the raw token is
used once in the outbound activation link. No password is generated or sent.
One transaction:

1. locks the idempotency key and returns the existing receipt for an identical retry;
2. creates the club as `PROVISIONING` and its effective entitlement projection;
3. creates the per-club settings singleton;
4. creates default MANAGER/OPERATOR/VIEWER permission rows;
5. creates exactly one disabled OWNER with a non-usable pending hash;
6. stores only the activation token hash and a `READY_FOR_OWNER` receipt;
7. commits atomically and returns stable club/owner IDs.

Reusing the key with another canonical JSON payload is an idempotency conflict.
The public Badmin activation endpoint hashes the chosen password and fragment
token before calling its only allowed function. That function locks the seed,
verifies every required row, activates OWNER and receipt, then changes the club
to `ACTIVE` last in the same transaction. A failed statement rolls everything
back. A repeated successful activation returns the same IDs without reseeding
or rewriting the password. Control Plane can rotate an unconsumed expired/lost
token hash without recreating any tenant row.

## Cache and storage namespace

- React Query and server cache keys begin with `clubId`.
- Runtime client identity is `(clubId, sessionId)` and is cleared on logout.
- Login throttling includes resolved club ID and hashed normalized identifier.
- Any future realtime channel includes club ID plus session ID.
- Personal theme may remain browser-global; tenant-derived content is never
  persisted under an unscoped browser key.
- New object keys are `clubs/{clubId}/branding/...`,
  `clubs/{clubId}/payment-qr/...`, and `clubs/{clubId}/players/...`.
- Existing Legacy Club keys remain readable from their DB references; no Phase
  2 re-key is required.
- Bulk deletion selects keys from current-club DB rows and never lists/deletes
  `avatar_player/` or another global prefix.

## Migration SQL plan

No SQL is generated or applied in Phase 2. Future manual migration files follow
this reviewed expand/write/backfill/constrain/switch order.

### M1 - Control foundation

- create `control` schema and exact runtime grants;
- create the minimum control tables and constraints above;
- insert Legacy Club with generated UUID/code, `ACTIVE` status, and effective
  entitlements matching every current capability;
- record the UUID in deployment migration configuration, never in business
  source.

Rollback: leave unused control rows/schema in place or remove them only before
any Badmin row references the club. Current Badmin behavior remains unchanged.

### M2 - Nullable expansion

- add nullable UUID `club_id` to all 18 current tables;
- defer auth identifier columns to the separately approved authentication phase;
- add `control.club_provisioning_receipts` and
  `control.club_owner_activations` only when provisioning and activation
  consumers are ready;
- add lightweight temporary backfill indexes only when measured necessary;
- keep current primary keys, foreign keys, and global unique constraints.

Rollback: old application ignores new nullable columns. Do not drop them during
an incident unless reviewed after recovery.

Execution result on 2026-08-27: M2 was implemented as four bounded UAT
subphases using fingerprint-guarded manual SQL. Prisma contains only optional
UUID scalar fields. All 18 columns are nullable, have no default, remain
unpopulated, and have no tenant FK/index/unique constraint. At the end of M2,
auth identifiers, provisioning receipts, compatibility writes, and backfill
remained deferred; compatibility writes were subsequently completed in M3.
Each subphase has a matching `_expand.sql`, `_validate.sql`, and
`_rollback.sql` file under `prisma/manual-migrations`.

### M3 - Compatibility writes

- deploy server-owned Legacy TenantContext;
- make every new tenant row write Legacy Club ID;
- defer normalized identifier columns to the later authentication cutover;
- monitor null or unexpected tenant writes;
- keep public routes and current login behavior temporarily unchanged.

Rollback: revert application writes while retaining nullable columns; stop
before backfill if coverage is incomplete.

Execution result on 2026-08-27: M3 is implemented for the currently approved
scope. A fail-closed server helper resolves the configured Legacy Club UUID;
clients cannot supply it. All current tenant-row creation paths stamp that UUID,
while reads and existing-row updates remain compatible with null Phase 4 data.
A static source guard, 97 focused tests, and a read-only UAT baseline monitor
passed. No backfill, tenant predicate cutover, normalized login identifier,
route change, entitlement enforcement, constraint, or index is part of M3.

### M4 - Backfill and reconciliation

Backfill in dependency order:

1. direct parents: `play_dates`, `shuttlecock_products`, `payment_bank_accounts`,
   `app_users`, `app_role_permissions`, `app_settings`;
2. `play_sessions`, then `auth_sessions`;
3. `session_players`, `shuttlecock_inventory`, `shuttlecock_movements`,
   `session_transactions`;
4. `runtime_matches`, `match_histories`, `session_summaries`;
5. `runtime_courts`, `session_player_images`, `match_history_players`.

All current rows receive Legacy Club ID. Reconcile row counts, nulls, orphans,
parent/child club equality, users/roles/sessions, settings/default bank,
finance totals, session totals, stock/movements, runtime revisions/rosters, and
image ownership without emitting raw PII or object keys.

Rollback: columns remain nullable and original business values are untouched;
restore the confirmed snapshot only if reconciliation shows business-data
mutation outside `club_id`/normalized identifier backfill.

Execution result on 2026-08-28: M4 completed on fingerprint `c2f96ce9dcd6`.
The approved runner processed 3,337 rows in 23 ordered batches. Two successful
rehearsals, separated by a guarded ownership-only reset, completed in 12.22 and
13.38 seconds with identical row counts, business checksums, relationship
checks, and operational aggregates. Final UAT state has zero null/unexpected
owner, orphan, tenant mismatch, stock mismatch, deadlock, or temp spill. All 18
tenant columns remain nullable without defaults and no M5 constraint or index
was introduced.

### M5 - Constraints and tenant indexes

- build required unique indexes concurrently where PostgreSQL permits;
- attach unique constraints to reviewed indexes;
- add direct club FKs and composite FKs as `NOT VALID`, then validate them;
- add checks for valid club/identifier requirements;
- replace global date/email/role/product-inventory uniqueness only after the
  compatibility application uses tenant keys;
- set `club_id NOT NULL` after zero-null and ownership validation;
- convert `app_settings` to `PRIMARY KEY(club_id)` only after all repositories
  stop using `id='default'`.

Rollback: drop only new constraints blocking the compatibility application and
retain populated club ownership. Old global constraints remain until the new
application is proven, so rollback does not recreate them under pressure.

Execution result on 2026-08-28: the M5 compatibility portion (Phase 8A-8E)
completed on UAT fingerprint `c2f96ce9dcd6`. PostgreSQL contains 43 valid and
ready tenant indexes, 18 validated direct club FKs, 16 validated composite
tenant FKs, and 18 required `club_id` columns. Application and business
reconciliation passed with 3,337 unchanged rows. The legacy-uniqueness removal
portion (Phase 8F) is split. The auth-specific global `app_users_email_key` was
removed after Phase 9 identifier cutover and rollback-only duplicate-email
proof. The remaining application/Prisma cutover and reviewed
SQL/validation/rollback package were applied on confirmed UAT on 2026-09-07.
No legacy global key remains and `app_settings` is keyed by `club_id`.

### M6 - Application isolation and contract switch

- switch repositories/APIs/auth/cache/storage according to this document;
- enable club-code routes with compatibility redirects;
- activate provisioning and entitlement enforcement only after their tests;
- keep Tenant #2 disabled through shadow validation.

Rollback: return Legacy Club traffic to the last compatible application and
routes. Do not remove ownership data or weaken constraints to onboard another
club.

## Repository, API, and database test matrix

| Layer | Required proof before Tenant #2 |
| --- | --- |
| Schema classification | Every current/new table has one recorded owner; no unclassified model |
| Unique constraints | Same date/identifier/role/product-inventory key allowed across clubs and rejected within one club |
| Composite FKs | Every child A -> parent B attempt is rejected, including nullable session/product/default-bank paths when populated |
| Tenant repository reads | List/detail/filter/aggregate for A never returns B; cross-tenant ID behaves missing |
| Tenant repository writes | Create/update/delete/bulk/reset always carry A and cannot mutate B |
| Auth | Same identifier can exist in A/B; selection resolves only selected club; session binds user+club; failure stays generic |
| Roles/users | Owner counts, disable/session invalidation, role permission reads and writes affect one club |
| Routes | Token A + URL B, body/query/header B, and resource B are rejected without disclosure |
| Settings | Singleton/default bank/branding are isolated; default bank B cannot be assigned to settings A |
| Storage | Upload namespaces A; logo/avatar/QR delete and bulk image reset cannot delete B; legacy keys stay readable |
| Runtime | Hydration/commit/revision and JSON roster are isolated by club+session; player B is rejected |
| History | Session history and reset affect only A; participant B cannot be written into history A |
| Completion | Session/settings/product/inventory/summary/finance/movement/runtime rows all use A; B references fail atomically |
| Finance/dashboard | Manual nullable-session finance and every period aggregate are tenant-scoped |
| Inventory | Product/stock/movement are isolated; concurrent writes cannot make stock negative |
| Entitlement/status | Downgrade/suspension A never changes B; historical reads and documented LIVE completion remain available |
| Provisioning | Same request retry creates one settings seed, role set, and OWNER flow; changed payload conflicts |
| Cache/rate limit | A/B query keys, runtime state, entitlement cache, and login attempts never collide |
| Legacy regression | All Phase 1 tests and protected runtime/finance/inventory behavior remain unchanged under Legacy TenantContext |

## Phase 2 exit decision

Phase 2 design is complete when this document, `docs/multi-tenant.md`,
`docs/readiness.md`, and `rules/multi-tenant-isolation.yaml` agree. Completion
does not clear Phase 0 environment blockers and does not authorize M1, Prisma,
SQL, repository, API, auth, or route implementation.

The approved next-step proposal is
[Control foundation and Legacy Club](./multi-tenant-control-foundation.md).
