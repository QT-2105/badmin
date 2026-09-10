# Next-layer readiness

Version: 2026-09-07

This file separates safe preparation from behavior-changing hardening. The
current UAT may contain a point-in-time production copy and must be treated as
sensitive non-production data. Promotion compares the explicitly selected live
target and never assumes UAT still represents current production state.

## Multi-tenant execution status

| Phase | Status | Gate |
| --- | --- | --- |
| Phase 0 - UAT safety and baseline | `PARTIAL/OWNER_EXCEPTION` | Fingerprint and baseline confirmed; backup/reset detail waived for this UAT execution only, not production promotion |
| Phase 1A - Auth and permission regression | `DONE` | Local/mock-only coverage; no database or external integration access |
| Phase 1B - Schedule and session regression | `DONE` | Local/mock-only repository coverage; no database access |
| Phase 1C - Runtime persistence regression | `DONE` | Local/mock regression baseline complete; repository hardening blockers remain tracked below |
| Phase 1D - Completion, finance, and inventory regression | `DONE` | Local/mock regression baseline complete; concurrency hardening remains tracked below |
| Phase 1E - Settings and destructive-action regression | `DONE` | Local/mock regression baseline complete; tenant scoping and storage consistency blockers remain tracked below |
| Phase 2 - Schema and Multi-Tenant contract | `DONE` | Documentation/rules only; no Prisma, DB, repository, API, auth, cache, or storage implementation |
| Phase 3A - Control schema proposal | `DONE` | Documentation/rules only; exact tables, capabilities, roles, rollback, and reconciliation proposed |
| Phase 3B - Manual migration UAT | `DONE` | Fingerprint-guarded migration and operational reconciliation passed on UAT |
| Phase 3C - Read-only integration | `DONE` | Narrow server-only projection and no-mutation role validation passed |
| Phase 4A - Access/config nullable expand | `DONE` | 5 tables; validation and 34 focused regressions passed |
| Phase 4B - Schedule/session nullable expand | `DONE` | 3 tables; validation and 31 focused regressions passed |
| Phase 4C - Runtime/history nullable expand | `DONE` | 5 tables; validation and 45 protected-runtime regressions passed |
| Phase 4D - Finance/inventory/images nullable expand | `DONE` | 5 tables; validation and 26 focused regressions passed |
| Phase 5A - Server-owned Legacy TenantContext | `DONE` | Fail-closed UUID configuration, structured missing-context log, and no client tenant input |
| Phase 5B - Access/config compatibility writes | `DONE` | New access/config rows receive Legacy Club ID; existing reads and update semantics unchanged |
| Phase 5C - Schedule/session compatibility writes | `DONE` | New dates, sessions, players, and summaries receive Legacy Club ID; domain behavior unchanged |
| Phase 5D - Runtime/history compatibility writes | `DONE` | New snapshots, courts, matches, histories, and participants receive Legacy Club ID; scheduler unchanged |
| Phase 5E - Finance/inventory/completion/image writes | `DONE` | New rows and nested writes receive Legacy Club ID; finance, stock, completion, and storage behavior unchanged |
| Phase 6 - Backfill and reconciliation | `DONE` | Two consistent UAT rehearsals; 3,337 rows assigned to Legacy Club with full reconciliation |
| Phase 7A - Users, roles, settings | `DONE` | Reads, counts, sessions, permission/config and storage writes scoped to server-owned Legacy Club |
| Phase 7B - Schedule and sessions | `DONE` | Dates, sessions, players, summaries, and Couples scoped; scheduling behavior unchanged |
| Phase 7C - Dashboard | `DONE` | Counts, aggregates, recent data, finance and inventory summaries scoped |
| Phase 7D - History and storage mutations | `DONE` | Tenant-only reset/delete and namespaced new objects; legacy references preserved |
| Phase 7E - Runtime repositories | `DONE` | Hydration, revision, snapshot, courts, matches and roster validation scoped; scheduler unchanged |
| Phase 7F - Finance, inventory, completion | `DONE` | All access and mutations scoped; formulas and movement semantics unchanged |
| Phase 8A-8E - DB constraints/indexes/NOT NULL | `DONE` | Fingerprint-guarded UAT rehearsal, isolation probe, reconciliation, and rollback package passed |
| Phase 8F - Drop legacy global uniqueness | `DONE_ON_UAT` | Remaining global keys removed, settings PK switched to `club_id`, readiness and Legacy reconciliation passed |
| Phase 9A-9E - Authentication theo CLB | `DONE_ON_UAT` | Identifier schema, tenant-bound sessions, minimal club lookup, login API/UI and Legacy compatibility passed |
| Phase 9F - Disable global bootstrap | `DONE_LOCAL/UAT_DEPLOY_PENDING` | Bootstrap creation returns 410 locally; deployment requires Phase 13 UAT acceptance first |
| Phase 10A-10F - Tenant URL, cache and storage | `DONE` | Tenant routes/redirects, permission normalization, tenant cache/state cleanup and namespaced new S3 writes completed locally; no DB or object migration |
| Phase 11A-11F - Runtime and concurrency hardening | `DONE_LOCAL` | Mandatory revision/CAS, immutable finished runtime, JSON roster validation, idempotent completion and serialized inventory/cross-operation writes passed deterministic regression |
| Phase 12A-12E - Effective entitlement | `DONE_ON_UAT` | Read-only projection grant and validation passed on fingerprint `c2f96ce9dcd6` |
| Phase 13 - Provisioning | `DONE_ON_UAT` | Migration, least-privilege grants, validation, idempotent OWNER activation rehearsal, forced rollback, and zero-residue check passed |
| Pre-Phase 14 release hardening | `DONE_ON_UAT` | Dynamic TenantContext, effective runtime roles, readiness, shadow and release-candidate gates passed |
| Phase 14 controlled Tenant #2 | `BLOCKED_EXTERNAL_INPUT` | Technical gates pass; controlled club/OWNER data, secure activation delivery and the separate Control Plane deployment are absent |

### Phase 6 result - 2026-08-28

Phase 6 backfilled all 3,337 production-copy rows across 18 tables to Legacy
Club `aa1f1aa3-c438-4498-96e9-ab228cd51f4f`. The fingerprint-guarded runner
uses ordered primary-key batches, `FOR UPDATE SKIP LOCKED`, a two-second lock
timeout, and `WHERE club_id IS NULL`. Partial retries are idempotent.

Current batch policy is 100 rows for small parent/config tables, 250 for
runtime/finance/image/auth children, and 500 for players and history. The
current dataset requires 23 batches. Rehearsal 1 completed in 12.22 seconds;
after an ownership-only reset, rehearsal 2 completed in 13.38 seconds. Both had
zero transaction rollback, deadlock, or temporary-file spill and produced the
same row counts, batch counts, ownership, relationship, and business results.
An immediate retry after completion updated zero rows and passed the same
reconciliation, proving the `WHERE club_id IS NULL` resume contract.

Final reconciliation proves:

- 18/18 tables have zero null or unexpected `club_id`; all 3,337 rows belong
  to Legacy Club;
- all row counts and 18 business-column checksums are unchanged;
- 16 parent/child checks have zero orphan and zero tenant mismatch;
- 53 finance rows total 49,540,000; session income/expense/profit remain
  26,375,000 / 20,540,000 / 5,835,000;
- stock 348 equals aggregate movement 348, with no negative or mismatched stock;
- runtime remains 52 courts, 3 matches, 530 histories, 2,120 history players,
  and maximum revision 320;
- settings, banks, permissions, users, auth sessions, storage-reference counts,
  session statuses, and runtime-roster anomaly checks match baseline;
- all 18 columns remain nullable without a default; no tenant constraint or
  tenant index was added.

The first instrumented attempt completed the backfill but its report query used
the wrong runtime revision column name. State was audited read-only, reset
safely, and excluded from the two required successful rehearsals. Phase 7 has
since completed as the application data-access phase. Phase 6 validation passed
153 tests, lint, typecheck, production
build, both source guards, all rule YAML parsing, and `git diff --check`.

### Phase 7 result - 2026-08-28

All current tenant-owned application access now derives the immutable Legacy
Club context on the server. Users/roles/settings, schedule/session, Dashboard,
history/storage mutations, runtime persistence, and finance/inventory/
completion are scoped independently. Cross-tenant IDs are rejected or returned
as missing before mutation. New logo, QR, and avatar keys use a club namespace;
Legacy object keys remain supported through their tenant-owned DB references.

The static tenant data-access guard inventories 20 production source files and
rejects ORM read/count/aggregate/update/delete/upsert calls without an explicit
`club_id`. Scheduler logic, runtime lifecycle, completion formulas, finance
sign rules, movement semantics, UI, login, routes, Prisma schema, constraints,
and UAT business data were not changed. Final validation passed 158 tests,
lint, typecheck, production build, tenant write/data-access guards, DB schema
automation guard, YAML parsing, and `git diff --check`.

The read-only UAT reconciliation confirmed fingerprint `c2f96ce9dcd6`, all
3,337 rows owned by Legacy Club, zero null/unexpected owner, unchanged 18 table
row counts, 139 constraints and 23 indexes, finance totals 26,375,000 /
20,540,000 / 5,835,000, stock 348 matching movements, runtime 52 courts / 3
matches / 530 histories / 2,120 participants, and zero orphan or malformed
runtime-roster anomaly. Phase 8A-8E was subsequently authorized and completed;
Phase 8F was gated by Phase 9 at that point.

### Phase 8 result - 2026-08-28

Phase 8A-8E completed on UAT fingerprint `c2f96ce9dcd6` without changing any
business row. It created 20 query indexes and 23 tenant unique indexes using
`CREATE INDEX CONCURRENTLY`, added 18 direct club FKs and 16 composite tenant
FKs as `NOT VALID`, validated each constraint separately, then set `club_id`
`NOT NULL` on all 18 tenant tables using validated checks.

The longest index build was 0.23 seconds, the longest constraint validation
was 1.20 seconds, and the longest `NOT NULL` cutover was 1.08 seconds. No
waiting `AccessExclusiveLock` remained. A rollback-only transaction created a
temporary control club, attempted to move a Legacy session across tenants, and
confirmed the composite FK rejected it; the probe club and attempted mutation
were rolled back.

Final reconciliation retained all 3,337 rows, zero null/unexpected owners,
zero orphan or tenant mismatch, finance totals 26,375,000 / 20,540,000 /
5,835,000, stock 348 matching movement 348, and the runtime/settings/
permissions/storage baselines. Planner checks use tenant indexes for the larger
player and history lookups; sequential scans/sorts on the current tiny tables
have low estimated cost. Prisma now declares required `club_id` and the applied
tenant index/unique contract. Validation passed 158 tests, lint, typecheck,
production build, Prisma validation, all source/schema guards, control
foundation audit, and `git diff --check`.

Phase 8F was initially held. Phase 9 completed the narrow
`app_users_email_key` cutover. The application and Prisma contract now use the
remaining tenant keys, with reviewed manual cutover/validation/rollback SQL.
That final SQL was applied and validated on UAT on 2026-09-07. Tenant #2 is
still not activated pending controlled-club inputs and secure activation.

### Phase 9 result - 2026-08-28

Phase 9A-9E completed against UAT fingerprint `c2f96ce9dcd6`. `app_users` now
supports nullable username, email, and phone plus normalized tenant-scoped
lookup fields, with at least one identifier required. The five copied users
used the legacy `email` column as usernames, so they were backfilled to
`username` without changing their stored password hashes. Three concurrent
tenant identifier indexes are valid and four identifier checks are validated.

Login now resolves an active club, classifies one identifier, queries only
that club, preserves the existing password verifier/token hash/cookie policy,
and creates a session bound to both user and club. Invalid, disabled,
malformed, wrong-password, other-club, and rollout-blocked access use the same
tenant-scoped generic failure. Public club lookup returns only code and name.
The old `{email,password}` request remains a Legacy Club compatibility alias.
Non-Legacy login is fail-closed until later request-context and route rollout.

The narrow Phase 8F email cutover removed only `app_users_email_key`. A
rollback-only temporary-club probe proved the same normalized email can exist
in two clubs and left no test club or user behind. Final UAT checks show 5
users, zero missing identifier/club, zero duplicate identifier group, zero
missing password hash, zero session tenant mismatch, and zero waiting
access-exclusive lock. All 3,337 business rows and finance/stock/runtime
baselines remain unchanged. The first idempotent column-width retry exceeded
Prisma's default five-second interactive-transaction limit and rolled back;
the bounded runner timeout was corrected, the retry updated zero user values,
and metadata verified `email varchar(320)`. Local validation passed 169 tests,
lint, typecheck, production build, Prisma
validation, and all source/schema guards.

Phase 9F is now complete locally. Global bootstrap discovery reports
`needsBootstrap: false`, and bootstrap creation returns `410` with a
provisioning instruction. This application release must not be deployed before
the Phase 13 provisioning tables/functions and OWNER activation have passed on
the exact UAT target.

### Phase 10 result - 2026-08-28

Phase 10A-10F is complete in the application without schema or business-data
mutation. All operational pages now have canonical `/{clubCode}` routes. The
route guard resolves the authenticated user's immutable `club_id`, reads that
club's canonical code, rejects a different URL code as not found, and applies
the existing permission map only after removing the validated tenant segment.
The URL remains a locator and is never accepted as authorization input.

Legacy root, Dashboard, schedule/date, session/runtime, finance, inventory,
users, and settings URLs resolve the club from the authenticated session and
redirect to the equivalent tenant-prefixed path. Internal navigation uses the
same tenant code; existing API URLs remain resource-oriented and continue to
derive ownership on the server.

Every operational React Query key now begins with `tenant, clubId`. Tenant
routes also mount a separate QueryClient keyed by session club/code, and clear
it on unmount. Logout clears that QueryClient, Zustand runtime data, the
current club's runtime/settings storage keys, and the two prior Legacy keys;
personal theme/sidebar preferences and another club's namespaced keys are not
removed. Server-side club-foundation cache input is the authenticated club UUID.

New logo, payment QR, and player-avatar objects use
`clubs/{clubId}/...`. Reads and replacements still accept old keys stored in
tenant-scoped DB rows. Delete-all enumerates only DB references owned by the
current club; this phase does not list, move, or bulk re-key existing objects.
Focused tests cover URL/session binding, tenant permission redirects, Legacy
redirects, cache/storage key separation, logout cleanup, namespace traversal,
and tenant-scoped image repositories. Final full-suite and build evidence is
recorded when the Phase 10 quality gates complete.

Phase 9F was completed locally only after the Phase 13 provisioning contract
was implemented. Non-Legacy login and Tenant #2 remain disabled until UAT
acceptance; Phase 10 did not authorize customer onboarding. Phase 11 was
authorized separately and is recorded below.

### Phase 11 result - 2026-09-04

Phase 11A-11F is complete at the application/repository boundary without a DB
schema or business-data migration. Runtime sync now requires an explicit
non-negative `expectedVersion`; the hook supplies the current hydrated Zustand
revision, and the service no longer supplies a hidden module-cache fallback.
The repository claims only the matching `(club_id, session_id, LIVE,
runtime_version)` row. Missing/stale versions, inactive sessions, and
FINISHED/CANCELLED sessions fail before runtime player/court/match writes.

Hydration and commit validate JSON rosters against the current tenant session:
four unique known players per match and no duplicate reservation across current
courts/previews. Existing scheduler generation, scoring, operator actions,
player lifecycle, Couple, request, End-Game, and exact-quartet behavior were not
changed.

Completion now atomically claims a LIVE session once and increments its runtime
revision before side effects. Product update/delete, manual movements, and
completion all acquire the same PostgreSQL product-row `FOR UPDATE` lock before
reading inventory. Concurrent completion retries cannot duplicate generated
transactions, movement, or summary; completion racing a manual output observes
serialized stock and rejects the operation that would make quantity negative.
Weighted averages, movement signs, voucher switches, and profit formulas remain
unchanged.

Deterministic concurrency tests cover two simultaneous completions and a
completion/manual `PLAY_USAGE` race. The current regression suite contains 185
passing tests, including mandatory/stale revision, immutable session, foreign
JSON player, idempotency, stock, movement, and generated-transaction assertions.
The static runtime-hardening guard protects the CAS/lock contract. All 185
tests, lint, typecheck, production build, Prisma/YAML validation, tenant
read/write guards, no-schema-automation guard, runtime-hardening guard, and
diff check pass. No UAT DB or S3 mutation was run for this code-only phase.

Tenant #2 remained disabled at Phase 11 because request-owned dynamic
TenantContext, provisioning/activation, remaining Phase 8F work, and later
release gates were separate work. Their newer status is recorded in the Phase
13 and pre-Phase 14 sections below.

### Phase 12 result - 2026-09-04

Phase 12A-12E is implemented locally. The Control Plane projection is reduced
to eight effective feature keys, normalized numeric limits, lifecycle status,
version, and validity. Badmin contains no plan-name or billing-state branch.
The same central guard protects page/API access after existing permission
checks; frontend navigation mirrors entitlement but is never the authority.

Denied evaluations emit structured shadow evidence containing club ID,
feature, decision reason, projection version, and live/stale source. Downgrade
or expiry performs no delete, backfill, or business-data mutation. Only a
tenant-owned `LIVE` session receives the continuation exception for session
operations, runtime persistence, participant/Couple support, and completion;
new schedules and inactive sessions remain blocked.

The projection cache is keyed by club/version/validity, refreshes after 15
seconds, and permits a bounded two-minute last-known-valid fallback during a
read outage, never beyond `valid_until`. Limits remain read-only because quota
counters are deferred.
The Legacy Club all-feature projection is covered by regression tests.

The UAT role currently needs the reviewed projection-column grant in
`prisma/manual-migrations/20260904120000_phase12_entitlement_projection_grant.sql`.
It was not applied because this phase did not reconfirm the exact active DB
project/branch/database/role. Phase 12 is therefore complete locally but not
activated on UAT. Local validation passes 195 tests, lint, typecheck,
production build, Prisma/YAML validation, all prior guards, the new entitlement
enforcement guard, and diff check. Phase 13 was subsequently authorized and is
recorded below.

### Phase 13 result - 2026-09-05

Phase 13 is implemented and validated on UAT. Control
Plane keeps ownership of registration, club-code collision UX, service calls,
and email delivery. Badmin does not expose a club registration/provisioning API.
The shared contract accepts stable IDs, canonical club and owner identifiers,
effective feature/limit values, and a hashed activation token; password fields
are explicitly rejected.

The reviewed transaction creates a `PROVISIONING` club, entitlement, per-club
settings, three configurable default role rows, one disabled OWNER, one
activation row, and one request-fingerprint receipt. An advisory transaction
lock makes identical retries return the same seed and rejects a changed payload.
OWNER activation accepts the raw secret only at the HTTPS boundary, hashes the
token/password in application memory, verifies the complete seed under row
locks, activates OWNER/receipt, and changes the club to `ACTIVE` last. Repeated
activation is stable. Control Plane can rotate an unused token after delivery
failure or expiry without duplicating tenant data.

The registration email template prominently marks `MÃ CLB ĐĂNG NHẬP`; its
activation token is placed in the URL fragment and stripped by the activation
page. Actual outbound email remains outside Badmin. The manual migration,
validation SQL, guarded rollback, static contract guard, focused tests, and a
fingerprint-confirmed rollback-only UAT rehearsal runner are present. On
2026-09-07, the migration and validation ran through `neondb_owner` against
fingerprint `c2f96ce9dcd6`. PostgreSQL 18 role ownership was preserved with a
NOLOGIN `badmin_schema_owner`; only the required `SELECT`/`INSERT` and OWNER
activation `UPDATE` privileges were granted on tenant seed tables. The
rehearsal proved stable provisioning retry, changed-payload rejection, stable
activation retry, complete seed counts, forced rollback, and zero residue.
Legacy baseline reconciliation remained unchanged. Non-Legacy onboarding and
Phase 14 remain blocked only by the Phase 8F cutover and final shadow/release
gates.

### Pre-Phase 14 hardening result - 2026-09-05

Authenticated guards now establish an immutable request-owned TenantContext
from the tenant-bound session. Repositories no longer obtain ownership from a
global Legacy helper. Missing context fails closed; the Legacy fallback is
available only through the explicit `BADMIN_ALLOW_LEGACY_TENANT_FALLBACK=true`
compatibility switch. Non-Legacy login uses an exact UUID allowlist and has no
wildcard mode.

The final Phase 8F Prisma/repository cutover and manual SQL package removed the
remaining global date/runtime/history/inventory/settings keys after validating
their tenant replacements. Settings are keyed by `club_id`; inventory and
play-date writes use compound tenant keys. The fingerprint-guarded package was
explicitly authorized and applied on UAT on 2026-09-07.

The read-only Phase 14 audit reports `ready: true`. The forced-rollback shadow
proved same identifier/date use across clubs, DB rejection of a cross-tenant
parent, idempotent provisioning, activation, and zero residue. A repeated run
used the effective Control Plane and Badmin runtime roles. Release-candidate
validation passes 211/211 tests, lint, typecheck, production build, Prisma and
all guards; the production dependency audit reports zero vulnerabilities.

#### Required UAT execution order before Phase 14

1. Reconfirm Neon project, branch, `neondb`, `neondb_owner`, fingerprint
   `c2f96ce9dcd6`, current backup/reset owner, and isolated S3/email/webhooks.
2. Phase 12 entitlement projection grant: completed and validated on UAT.
3. Phase 13 provisioning migration, verification, rollback-only rehearsal, and
   Legacy reconciliation: completed on UAT.
4. Deploy the tenant-only application release with
   `BADMIN_ALLOW_LEGACY_TENANT_FALLBACK=false`; keep the non-Legacy login
   allowlist empty. Confirm Legacy login, routes, runtime, completion, finance,
   inventory, settings, and destructive operations.
5. Final Phase 8F key cutover: completed and validated on UAT. Do not run its
   rollback after cross-club duplicate values are created.
6. Bind the actual Control Plane login role to `badmin_control_writer` using a
   separately reviewed role-membership change in the Control Plane deployment.
   No runtime login name or credential is invented in this repository.
7. `npm run audit:phase14-readiness`: completed with no blocker.
8. `npm run phase14:shadow`: completed with rollback and zero residue; Legacy
   reconciliation remains unchanged.
9. Await controlled-customer details and secure OWNER activation delivery from
   the separate Control Plane. Only then provision Tenant #2 and add its UUID
   to the rollout allowlist.

### Phase 5 result - 2026-08-27

Phase 5 deploys one temporary server-owned Legacy Club context from
`BADMIN_LEGACY_CLUB_ID`. Missing or malformed configuration fails closed and
emits a structured `tenant_context_missing` server log. Request bodies, query
strings, URLs, headers, and browser state cannot provide or override this ID.

Every current record-creation path across the 18 tenant-owned models now stamps
the Legacy Club UUID, including nested and bulk writes. Compatibility reads
remain unchanged so the production-copy rows with null `club_id` are still
readable. Existing-row updates intentionally do not populate `club_id`; that is
Phase 6 backfill work. Login, UI, routing, permissions, scheduling lifecycle,
runtime revision behavior, completion formulas, finance, inventory movements,
and image key/deletion behavior were not redesigned.

The static write-coverage guard passes for all 15 source files containing the
current insert paths. Focused Phase 5 regression passes 97 tests and the full
project suite passes 153 tests. Lint, typecheck, production build, both source
guards, YAML parsing, and diff whitespace validation pass. The read-only
UAT monitor validates fingerprint `c2f96ce9dcd6`, all 18 tables, zero positive
null-count delta from the Phase 4 baseline, zero unexpected club IDs, and zero
backfilled rows. This was the expected Phase 5 state before the separately
authorized Phase 6 backfill recorded above.

### Phase 1A result - 2026-08-27

The owner explicitly initiated Phase 1A while Phase 0 environment gates remain
open. This exception is limited to deterministic local tests with mocked
repositories. No UAT database, S3 object, email, webhook, schema, runtime
scheduler, or production behavior was changed.

Regression coverage now locks:

- login validation, identifier normalization, generic invalid-credential
  responses, disabled-user rejection, password failure, session creation, last
  login update, rate-limit cleanup, and auth-cookie dispatch;
- missing, valid, expired, and disabled-user sessions, including hashed-token
  persistence and expired-session cleanup;
- role/status normalization, permission allowlisting, OWNER behavior, explicit
  role permissions, disabled-user denial, and route-to-permission mapping;
- API authentication, role and permission denial, auth error responses, page
  login redirect, unauthorized page redirect, and authorized page access.

Validation passed with 41 project tests in total, including 21 new Phase 1A
tests. `npm test`, lint, typecheck, production build,
`guard:no-db-schema-automation`, and `git diff --check` all passed. Phase 1B was
subsequently authorized by a separate explicit owner request and is recorded
below.

### Phase 1B result - 2026-08-27

Phase 1B adds deterministic repository regression coverage for schedule and
session behavior. Prisma is mocked, so the suite does not read or mutate the
UAT database or any external integration. Production repositories, APIs,
runtime state, scheduler behavior, and domain rules were not changed.

Regression coverage now locks:

- play-date mapping and ordering, required/invalid/past-date validation,
  duplicate-date rejection, default title and note normalization, past-date
  readonly behavior, and deletion only when no sessions exist;
- session mapping and status normalization, required inputs, parent play-date
  validation, court-count cap, structural-edit restrictions, four-player start
  minimum, `LIVE` persistence, and pending-only deletion;
- session-player mapping, legacy End-Game tag normalization, financial input
  validation, arrival baseline and next-match metadata, End-Game availability,
  Couple gender protection, runtime-reference deletion guards, and summary
  player-count refresh;
- Couple grouping, member ordering, two-distinct-members and same-session
  requirements, format/gender validation, atomic number reservation,
  synchronized next-match request, concurrent reservation conflict, and safe
  deletion.

Validation passed with 72 project tests in total, including 31 new Phase 1B
tests. `npm test`, lint, typecheck, production build,
`guard:no-db-schema-automation`, and `git diff --check` all passed. The first
build attempt was blocked only by sandbox DNS access to Google Fonts; the same
build passed with network access. Phase 1C was subsequently authorized by a
separate explicit owner request and is recorded below.

### Phase 1C result - 2026-08-27

Phase 1C adds deterministic regression coverage around the current-state
runtime persistence boundary. Prisma, fetch, and API dependencies are mocked;
the suite does not access UAT data. Scheduler, Zustand lifecycle, production
repositories, API behavior, and runtime UI were not changed.

Regression coverage now locks:

- explicit, active, and fallback runtime-session resolution; session revision
  hydration; player status, gender, tag, and timestamp mapping;
- persisted court hydration and generation of empty recovery courts from
  `play_sessions.court_count` when no runtime court rows exist;
- current and legacy JSON team shapes, queue metadata, recent valid quartet
  hydration, and empty-snapshot behavior;
- snapshot envelope validation, duplicate-player rejection, compare-and-swap
  revision conflict, atomic FULL queue cleanup, queue/court persistence, and
  propagation of the claimed `source_revision`;
- client hydration revision caching, explicit revision preservation,
  same-session write serialization, service conflict mapping, and API
  `409/currentVersion` responses;
- the current presentation contract that `COMPLETED`/`FINISHED` and `CANCELLED`
  sessions are readonly while pending and active sessions are not.

The audit also confirms two existing hardening blockers. The snapshot API and
repository do not independently reject writes based on completed/cancelled
session status, so readonly is currently enforced at the presentation layer.
The repository also permits a sync without `expectedVersion`; the service only
adds a cached version after hydration or when the caller supplies one. Phase 1C
does not silently change either behavior because this phase is regression-only.
Both remain required, separately reviewed hardening work before tenant
promotion.

Validation passed with 99 project tests in total, including 27 new Phase 1C
tests. `npm test`, lint, typecheck, production build,
`guard:no-db-schema-automation`, and `git diff --check` all passed. Phase 1D was
subsequently authorized by a separate explicit owner request and is recorded
below.

### Phase 1D result - 2026-08-27

Phase 1D adds deterministic regression coverage around completion, lightweight
finance, and shuttlecock inventory. Prisma is mocked, so no UAT data or
external integration is accessed. Production formulas, voucher behavior,
movement semantics, stock updates, and transaction boundaries were not
changed.

Regression coverage now locks:

- completion input, session-state, active-court, product, stock, and average
  usage-price validation;
- paid-player net slot income, court/shuttlecock/extra expense calculation,
  total profit, note normalization, and session summary values;
- independent court-fee and shuttlecock-usage voucher switches, strict opt-in
  extra-expense voucher creation, and inclusion of real costs in profit even
  when corresponding vouchers are disabled;
- mandatory `PLAY_USAGE` movement, stock decrement, player/runtime
  finalization, runtime-match cleanup, session finish, and summary creation in
  the completion transaction;
- NORMAL/DEDUCTION finance calculation, finance validation, filtered listing,
  session-total refresh, and manual finance creation with nullable
  `session_id` and no session refresh;
- inventory value and movement-total mapping, weighted import averages,
  negative `PLAY_USAGE`, insufficient-stock rejection, and zero-difference
  adjustment behavior.

The regression suite proves current single-transaction intent but does not make
completion or inventory concurrency-safe. Both repositories still calculate
from a previously read stock value before writing the next quantity; concurrent
requests require separately reviewed row locking or an atomic conditional
update. This remains a promotion blocker and was not changed in regression-only
Phase 1D.

Validation passed with 119 project tests in total, including 20 new Phase 1D
tests. `npm test`, lint, typecheck, production build,
`guard:no-db-schema-automation`, and `git diff --check` all passed. Phase 1E was
subsequently authorized by a separate explicit owner request and is recorded
below.

### Phase 1E result - 2026-08-27

Phase 1E adds deterministic regression coverage around operational settings,
payment bank accounts, branding, match-history reset, and player-image
deletion. Prisma and S3 are mocked, so no UAT database row or object-storage
object is read, changed, or deleted. Production routes, repositories, settings
semantics, and destructive behavior were not changed.

Regression coverage now locks:

- singleton settings defaults, persisted-value normalization, maximum court
  count bounds, active default-bank validation, and normalized upsert behavior;
- active bank-account ordering, required fields, QR upload and cleanup,
  default-account initialization, clearing a deleted default account, and
  best-effort object cleanup after account deletion;
- branding defaults, club-name validation, logo replacement ordering, old-logo
  cleanup, and logo-reference deletion;
- unknown-player protection, individual avatar deletion, active-image status,
  player avatar-reference cleanup, bulk S3 key prefix/deduplication behavior,
  and no DB mutation when an S3 deletion fails;
- atomic participant-before-match history reset and returned deletion counts;
- `settings.manage` permission checks before both global destructive API calls.

The source audit additionally confirms that the existing settings UI requires a
separate confirmation dialog and shows consequence copy before history reset or
bulk player-image deletion.

The audit also confirms current single-club boundaries that must not be carried
unchanged into multi-tenant operation. Settings, branding, bank accounts,
match-history reset, and bulk player-image deletion are currently global and
unscoped. A second club remains prohibited until these reads and mutations are
tenant-owned and cross-tenant destructive tests pass. Individual logo/avatar
deletion removes the S3 object before clearing its DB reference, so a later DB
failure can leave a stale reference. Bulk avatar deletion can also stop after a
partial S3 deletion set. Conversely, bank-account deletion commits DB removal
before best-effort QR cleanup and can leave an orphan object. These are
separately reviewed storage-consistency hardening tasks, not behavior changes
for regression-only Phase 1E.

Validation passed with 140 project tests in total, including 21 new Phase 1E
tests. `npm test`, lint, typecheck, production build,
`guard:no-db-schema-automation`, and `git diff --check` all passed. Phase 1 is
complete as a regression baseline. The owner subsequently authorized the
documentation-only Phase 2 exception recorded below; Phase 0 remains blocked
and no implementation or DB-sensitive tenant work is authorized.

### Phase 2 result - 2026-08-27

Phase 2 freezes the model-by-model schema and integration contract in
[Multi-tenant schema and integration contract](./multi-tenant-schema-contract.md).
The design classifies all 18 current Prisma models as tenant-owned and records
their target `club_id`, unique constraints, composite foreign keys, indexes,
nullable relations, current query uses, migration order, and rollback boundary.

The contract also fixes the minimum Control Plane projection, club code and
lifecycle policy, server-owned TenantContext, tenant-bound login identifiers
and auth sessions, effective entitlement, idempotent provisioning, separate DB
roles, non-disclosing cross-tenant errors, cache keys, storage namespaces,
repository/API mapping, staged SQL plan, and pre-Tenant-#2 test matrix.

Phase 2 itself changed no Prisma model, SQL migration, repository, API, auth
flow, cache, storage key, or business behavior. Phase 3 was later authorized
for the confirmed UAT fingerprint under the owner exception recorded below;
that exception does not clear the production-promotion gates.

### Phase 3A result - 2026-08-27

Phase 3A freezes the minimal proposal in
[Control foundation and Legacy Club](./multi-tenant-control-foundation.md).
Only `control.clubs` and `control.club_entitlements` enter the foundation
release. The proposal fixes club/status/code constraints, the eight currently
available capabilities, empty initial limits, DB group roles, column-limited
Badmin reads, Control Plane ownership, manual rollback, and UAT reconciliation.

### Phase 3B/3C result - 2026-08-27

The owner accepted fingerprint `c2f96ce9dcd6` as the authoritative UAT target
and explicitly waived backup/reset details for this UAT-only execution. The
manual transaction created the minimal `control` foundation, Legacy Club
`tt-badminton`, and entitlement version `1`. It did not alter any current
public operational table or Prisma model.

The Phase 3C repository reads only club identity, lifecycle status, and
entitlement version after `SET LOCAL ROLE badmin_uat_app`. It is not wired into
the current request path and does not enforce status or features. The UAT audit
confirmed correct ownership, denied mutation privileges, and no `PUBLIC`
schema access.

Pre/post reconciliation retained all 18 public-table row counts, user/session
aggregates, 1 LIVE session, finance totals, stock quantity `348` matching
movement quantity `348`, settings/permissions snapshots, and zero orphan or
runtime-roster anomalies. Phase 3 completed before the separately authorized
Phase 4 work below.

### Phase 4A-4D result - 2026-08-27

Phase 4 added one nullable UUID `club_id` scalar to each of the 18 existing
Prisma models and UAT public tables. The four migration transactions completed
in approximately 1.2-1.7 seconds each under a two-second lock timeout.

Each subphase has reviewed expand, read-only validation, and emergency rollback
SQL. All four validation files were executed read-only on UAT. Rollback files
were retained but not applied; they are valid only before Phase 5 writes begin.

Final reconciliation proved:

- 18/18 columns are UUID, nullable, without a default, and still entirely null;
- no tenant FK, index, unique replacement, `NOT NULL`, auth identifier, login,
  compatibility write, or backfill was introduced;
- all 18 table relfilenodes stayed unchanged, so no table rewrite occurred;
- 18 table row counts, 139 existing constraints, 23 existing indexes, finance,
  inventory, runtime, settings, permissions, storage references, and anomaly
  counts match the pre-Phase 4 baseline;
- current repositories and business flows continue to ignore `club_id`.

Phase 4 is complete. Stop before Phase 5.

### Phase 0 findings - 2026-08-26

- `DATABASE_URL` and `DATABASE_URL_UNPOOLED` resolve to the same normalized
  Neon endpoint, database, and role; pooled/direct roles are configured as
  expected.
- The safe target fingerprint is `c2f96ce9dcd6`. Repository configuration does
  not identify the Neon project and branch names, so their mapping to this
  fingerprint still requires explicit confirmation from Neon console/owner.
- The configured application URL is local UAT development.
- No email, webhook, payment, or messaging environment keys were detected in
  the current `.env` or source audit.
- S3 credentials have upload/delete capability and the configured bucket has no
  UAT/test/dev naming marker. Treat it as production-risk until bucket ownership
  is confirmed or replaced with an isolated UAT bucket.
- Database baseline, copied auth-session status, live-session count, drift,
  orphan checks, and aggregate reconciliation were queried read-only against
  confirmed fingerprint `c2f96ce9dcd6` without raw PII.
- UAT snapshot/reset timestamp, reset procedure, and responsible owner are not
  recorded in repository configuration.

The read-only diagnostic is `npm run audit:uat-baseline`. It refuses to connect
unless `BADMIN_UAT_DB_TARGET_FINGERPRINT` matches the reviewed target and then
runs every query in a read-only transaction. Its output contains aggregates,
constraint/index names, and anomaly counts only; it excludes raw PII, tokens,
hashes, object keys, and URLs.

Phase 0 recovery evidence remains incomplete for production promotion. The
owner's UAT exception authorized Phase 3B/3C only; do not begin Phase 4 or use
this exception for production without a new bounded instruction.

## Known promotion work

The current audit identified these separately approved tasks:

1. reconcile target database foreign keys and indexes with the Prisma model;
2. enforce completed/cancelled immutability at the snapshot repository boundary;
3. require runtime revisions explicitly for every snapshot write;
4. protect inventory and completion from concurrent read-check-write races;
5. make settings, branding, payment accounts, storage keys, and destructive
   operations tenant-owned before onboarding a second club;
6. define retry/reconciliation behavior for DB/S3 partial failures during logo,
   avatar, and payment-QR deletion;
7. distinguish process health from database reachability;
8. update audited production dependencies and run full regression;
9. extend failure-injection and cross-tenant repository/API tests during the
   corresponding hardening and tenant migration phases.

These are tracked risks, not authorization to mutate a database or redesign
protected behavior.

## Multi-tenant promotion boundary

The approved target and phase-by-phase exit criteria live in
[Multi-tenant architecture and migration](./multi-tenant.md). In addition to
the blockers above, a second club is prohibited until:

1. every tenant-owned row and relation has validated tenant ownership;
2. repositories, APIs, aggregates, bulk mutations, caches, and storage are
   tenant-scoped;
3. authentication binds one user and auth session to one club;
4. runtime, completion, finance, inventory, settings, and destructive-action
   cross-tenant tests pass;
5. Legacy Club counts, finance totals, stock, runtime, permissions, and current
   capabilities reconcile with the baseline;
6. provisioning is idempotent and shadow validation has completed.

RLS, distributed cache, quotas, partitioning, and database-per-tenant remain
optional later work and are not substitutes for these gates.

## Promotion boundary

Promotion requires explicit owner confirmation of:

- Neon project, branch, database, and role;
- backup and recovery plan;
- reviewed SQL and expected drift;
- bootstrap/owner state;
- environment secrets and object-storage target;
- runtime, finance, inventory, auth, and permission regression results.

Use the validation contract in [governance](./governance.md) and
`rules/release-readiness.yaml`.
