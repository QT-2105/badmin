-- Optional cleanup after every public-table FK to control.clubs has been dropped.
BEGIN;
GRANT badmin_schema_owner TO neondb_owner;
SET LOCAL ROLE badmin_schema_owner;
REVOKE REFERENCES (id) ON control.clubs FROM neondb_owner;
SET LOCAL ROLE NONE;
REVOKE badmin_schema_owner FROM neondb_owner;
COMMIT;
