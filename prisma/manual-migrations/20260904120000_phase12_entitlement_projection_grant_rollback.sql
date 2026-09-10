-- Emergency rollback for the Phase 12 projection expansion.

BEGIN;

GRANT badmin_schema_owner TO neondb_owner WITH SET TRUE;
SET LOCAL ROLE badmin_schema_owner;

REVOKE SELECT (features, limits, valid_until, updated_at)
ON control.club_entitlements FROM badmin_uat_app;

RESET ROLE;
GRANT badmin_schema_owner TO neondb_owner WITH SET FALSE;

COMMIT;
