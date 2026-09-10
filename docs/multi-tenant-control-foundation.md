# Control foundation and Legacy Club

Version: 2026-08-27
Status: Phase 3A, 3B, and 3C complete on confirmed UAT

## Scope

This document records the reviewed Phase 3 foundation and its UAT result. It
defines only:

- `control.clubs`;
- `control.club_entitlements`, the read projection consumed later by Badmin;
- database ownership and grants;
- Legacy Club seed inputs and UAT reconciliation;
- the no-enforcement read-only integration planned for Phase 3C.

It does not create plan, subscription, billing, promotion, feature-catalog, or
override tables. Those remain Control Plane source design for a later approved
phase. It does not add `club_id` to current Badmin tables, edit Prisma, or
change the current login and operational flow.

## Phase 3 status and gates

| Subphase | Status | Gate |
| --- | --- | --- |
| Phase 3A - Control schema proposal | `DONE` | Proposal, capability seed, ownership, rollback, and reconciliation are fixed here |
| Phase 3B - Manual migration UAT | `DONE` | Fingerprint-guarded transaction applied to `c2f96ce9dcd6`; reconciliation passed |
| Phase 3C - Read-only integration | `DONE` | Server-only narrow projection, role downgrade, tests, and UAT diagnostic passed |

The owner explicitly accepted skipping backup/reset details for this UAT-only
execution. That exception does not clear production-promotion recovery gates
and does not authorize Phase 4.

## Minimal control schema

Both tables are `CONTROL_OWNED` and live in the `control` PostgreSQL schema.
They use `TIMESTAMPTZ` because lifecycle and entitlement validity are
environment-independent instants.

### `control.clubs`

| Column | Contract |
| --- | --- |
| `id` | UUID primary key, generated once; canonical Tenant ID |
| `code` | `varchar(80)`, required, globally unique, canonical lowercase slug |
| `name` | `varchar(255)`, required; names may repeat |
| `status` | `varchar(20)`, required; `PROVISIONING`, `ACTIVE`, `GRACE_PERIOD`, `SUSPENDED`, or `ARCHIVED` |
| `created_at` | required `timestamptz`, default current time |
| `updated_at` | required `timestamptz`, default current time; writer updates it on change |

Database constraints:

- primary key on `id`;
- unique constraint on `code`;
- non-empty trimmed name;
- code matches `^[a-z0-9]+(?:-[a-z0-9]+)*$`;
- status is one of the five approved lifecycle values;
- an update trigger rejects code changes when the previous status is not
  `PROVISIONING`.

The trigger allows the final generated code to be set while provisioning and
locks it once activation has occurred. Club rename changes `name`, not `code`.
Archival is a status update; this table must not cascade-delete operational
data.

Query support:

- unique `code` serves exact login/URL lookup;
- index `(status, lower(name))` supports the small login-visible suggestion
  query without introducing a duplicated `searchable` field;
- no fuzzy-search extension is required in this phase.

### `control.club_entitlements`

| Column | Contract |
| --- | --- |
| `club_id` | UUID primary key and FK to `control.clubs(id)` with `ON DELETE RESTRICT` |
| `version` | positive bigint, required, monotonically increasing |
| `features` | JSONB object of stable capability key to boolean |
| `limits` | JSONB object of stable limit key to number/string; empty in Legacy seed |
| `valid_until` | nullable `timestamptz`; null for the initial Legacy projection |
| `updated_at` | required `timestamptz`, default current time |

Database constraints confirm `features` and `limits` are JSON objects and
`version > 0`. Badmin validates known keys and value types when reading; the DB
does not embed plan-name logic.

This table is an effective read projection, not the source of commercial
truth. During the foundation release, Control Plane seeds the Legacy Club
projection directly. Later plan/subscription/override sources may replace how
the projection is calculated without changing Badmin's read contract.

## Legacy Club effective capabilities

The initial projection uses version `1`, no expiry, no commercial limits, and
enables every current Badmin module/capability:

```json
{
  "dashboard": true,
  "schedule": true,
  "session.runtime": true,
  "session.completion": true,
  "finance": true,
  "inventory": true,
  "users": true,
  "settings": true
}
```

`limits` is `{}`. `max_court_count_per_session` remains an operational setting,
not a package quota. Branding, bank accounts, history reset, and player-image
management remain under `settings`. Current permission keys remain separate:
entitlement says the club has a capability; permission says the current user
may perform an action inside it.

Phase 3C reads only club identity, lifecycle status, and entitlement version.
It does not enforce or expose the feature JSON to current business branching.

## Database ownership proposal

Use NOLOGIN group roles and grant the environment's existing login roles into
them only after the owner confirms the exact UAT role mapping:

| Group role | Responsibility |
| --- | --- |
| `badmin_schema_owner` | Own `control` schema, tables, constraints, functions, and reviewed migrations |
| `badmin_control_writer` | Control Plane runtime: `USAGE` plus `SELECT/INSERT/UPDATE` on control tables; no operational Badmin-table grants |
| `badmin_uat_app` | Badmin UAT effective runtime role: `USAGE` plus column-limited `SELECT` needed for club identity/status and entitlement version |

Rules:

- revoke schema/table/function access from `PUBLIC`;
- the migration login uses `SET ROLE badmin_schema_owner` for DDL;
- Control Plane runtime receives no direct write grant on current Badmin
  operational tables;
- Control Plane runtime receives `EXECUTE` only on the approved code-guard
  trigger function needed by its table updates;
- Badmin runtime receives no `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, or
  sequence privilege in `control`;
- Badmin runtime gets `SELECT(id, code, name, status)` on `control.clubs` and
  `SELECT(club_id, version)` on `control.club_entitlements` for Phase 3C;
- future plan/subscription tables do not inherit Badmin grants;
- default privileges in `control` are explicitly set so later tables are not
  accidentally readable or writable by either runtime role.

No password or connection string is stored in repository files. The current
UAT connection authenticates as `neondb_owner`; Phase 14 configures the
unpooled application connection to assume `badmin_uat_app`, while Control Plane
rehearsals explicitly assume `badmin_control_writer`. Creating separate LOGIN
credentials remains deployment work before production promotion.

## Phase 3B manual migration package

After explicit target confirmation, one new reviewed SQL file may be created
under `prisma/manual-migrations`. It must contain an exact, non-placeholder
package in this order:

1. begin transaction where PostgreSQL permits;
2. create/verify NOLOGIN group roles using the confirmed administrative role;
3. create `control` owned by `badmin_schema_owner`;
4. revoke `PUBLIC` access;
5. create both tables, checks, unique/indexes, and code-immutability function/
   trigger;
6. create the exact Legacy Club with one pre-generated UUID, confirmed name,
   confirmed unique code, and `ACTIVE` status;
7. create entitlement version `1` with the capability JSON above and `{}`
   limits;
8. grant column-limited read access to the mapped Badmin role and writer access
   to the mapped Control Plane role;
9. set safe default privileges;
10. run in-transaction assertions and commit.

The file must fail closed when:

- the expected target fingerprint/configuration is not the confirmed UAT;
- a club exists with the same code but a different UUID;
- the Legacy UUID exists with different identity data;
- an entitlement row exists with a different version/payload;
- the runtime role mapping is absent;
- any object is owned by an unexpected role.

The SQL is idempotent only for the exact same Legacy UUID, code, name, and
entitlement payload. It must not silently update a conflicting club.

### Required owner inputs before creating or applying SQL

- Neon project name/ID;
- Neon branch name/ID;
- database name;
- migration/admin role;
- reviewed target fingerprint matching the repository diagnostic;
- backup/snapshot timestamp, reset procedure, and responsible owner;
- confirmed isolation of mutable UAT integrations;
- exact current club official name;
- approved generated Legacy Club code;
- exact existing Badmin runtime login role;
- exact future Control Plane runtime login role or decision to defer its login
  membership while still creating the NOLOGIN group role.

No secret or connection string is written into docs or SQL.

## Rollback boundary

Before any Badmin table references `control.clubs`, Phase 3B rollback is:

1. revoke runtime memberships/grants created by this migration;
2. drop the code-immutability trigger/function;
3. drop `control.club_entitlements`;
4. drop `control.clubs`;
5. drop `control` only if empty;
6. drop newly created NOLOGIN roles only when they own nothing and have no
   memberships.

Rollback is owner-approved and manual. If Phase 3C has already deployed, roll
back that read-only code first. Once later phases add `club_id` foreign keys,
this drop-based rollback is no longer valid; preserve the control rows and use
the later expand/contract rollback plan.

## Phase 3B UAT reconciliation

Diagnostics output aggregates/identifiers needed for verification only and
must not print credentials or production-derived PII.

Required checks:

- exactly one `control.clubs` row for the approved Legacy UUID;
- code equals the approved canonical code and is unique;
- name/status equal the approved values and status is `ACTIVE`;
- exactly one entitlement projection for that club;
- entitlement version is `1`;
- the eight expected capability keys are present and true, with no unknown key;
- limits is an empty object and `valid_until` is null;
- table/schema/function ownership equals `badmin_schema_owner`;
- Badmin runtime can select only the approved columns and cannot mutate either
  table;
- Control Plane mapped runtime can write control rows and cannot mutate a
  representative Badmin operational table;
- `PUBLIC` has no control-schema access;
- current Badmin row counts, auth, runtime, finance, stock, settings, and tests
  remain unchanged because no current table was altered.

## Phase 3C read-only integration plan

Phase 3C starts only after the reconciliation above passes. The smallest safe
integration is:

- one server-only repository that reads by configured Legacy Club UUID;
- a narrow result containing `id`, `code`, `name`, `status`, and
  `entitlementVersion`;
- a local/mock repository test plus a UAT read-only diagnostic;
- no page/API routing change, no client-provided club ID, no auth/session shape
  change, no entitlement guard, and no feature-based UI branching;
- no request-path dependency that could make the current Badmin flow fail when
  the projection is unavailable;
- structured diagnostic status without raw entitlement JSON or secrets.

The temporary Legacy UUID is deployment configuration through
`BADMIN_LEGACY_CLUB_ID`, not hard-coded application business logic. Phase 3C
proves Badmin's read privilege and contract compatibility only. TenantContext
enforcement belongs to later reviewed phases.

## Phase 3 execution result - 2026-08-27

- Manual SQL: `prisma/manual-migrations/20260827093000_control_foundation_legacy_club.sql`.
- UAT target: fingerprint `c2f96ce9dcd6`, database `neondb`, migration role
  `neondb_owner`.
- Legacy Club: UUID `aa1f1aa3-c438-4498-96e9-ab228cd51f4f`, code
  `tt-badminton`, name `TT Badminton`, status `ACTIVE`.
- Entitlement version `1` contains exactly eight enabled current capabilities,
  empty limits, and no expiry.
- `control` schema, tables, and guard function are owned by
  `badmin_schema_owner`; `PUBLIC` has no schema access.
- `badmin_uat_app` can read only the approved columns and cannot mutate either
  foundation table.
- `npm run audit:control-foundation` passed and the post-migration UAT baseline
  retained all 18 public-table row counts, 1 LIVE session, financial totals,
  stock reconciliation, settings/permissions, and zero orphan/runtime-roster
  anomalies from the pre-migration baseline.
- Current login, auth session, routes, entitlement enforcement, Prisma schema,
  and all protected business behavior remain unchanged.

Phase 3 is complete. Its stop boundary was satisfied; Phase 4 was later
authorized separately and is recorded in the schema contract and readiness
document.
