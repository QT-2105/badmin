-- Phase 8C prerequisite. control.clubs is owned by badmin_schema_owner while
-- the reviewed public-schema migration login is neondb_owner.
-- Grant only the column-level REFERENCES privilege needed to create direct
-- tenant FKs; do not grant Control Plane mutation rights.

BEGIN;
GRANT badmin_schema_owner TO neondb_owner;
SET LOCAL ROLE badmin_schema_owner;
GRANT REFERENCES (id) ON control.clubs TO neondb_owner;
SET LOCAL ROLE NONE;
REVOKE badmin_schema_owner FROM neondb_owner;
COMMIT;
