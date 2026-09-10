-- Phase 12A: allow Badmin to read only the effective entitlement projection.
-- Apply manually only after confirming project, branch, database, role, and target fingerprint.

BEGIN;

GRANT badmin_schema_owner TO neondb_owner WITH SET TRUE;
SET LOCAL ROLE badmin_schema_owner;

GRANT SELECT (club_id, version, features, limits, valid_until, updated_at)
ON control.club_entitlements TO badmin_uat_app;

RESET ROLE;
GRANT badmin_schema_owner TO neondb_owner WITH SET FALSE;

COMMIT;
