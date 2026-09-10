-- Phase 3B: minimal Control Plane foundation for the confirmed UAT target.
-- Exact target fingerprint: c2f96ce9dcd6 (database neondb, role neondb_owner).
-- Apply manually through one explicit transaction. Do not run at app startup/CI.

DO $$
DECLARE
  role_name text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY[
    'badmin_schema_owner',
    'badmin_control_writer',
    'badmin_uat_app'
  ]
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = role_name) THEN
      EXECUTE format(
        'CREATE ROLE %I NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION',
        role_name
      );
    ELSIF EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = role_name
        AND (rolcanlogin OR rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication)
    ) THEN
      RAISE EXCEPTION 'Existing role % has unexpected elevated attributes', role_name;
    END IF;
  END LOOP;
END $$;

-- statement-breakpoint
GRANT badmin_schema_owner TO neondb_owner;

-- statement-breakpoint
GRANT badmin_uat_app TO neondb_owner;

-- statement-breakpoint
CREATE SCHEMA IF NOT EXISTS control AUTHORIZATION badmin_schema_owner;

-- statement-breakpoint
DO $$
DECLARE
  schema_owner text;
BEGIN
  SELECT pg_get_userbyid(nspowner)
  INTO schema_owner
  FROM pg_namespace
  WHERE nspname = 'control';

  IF schema_owner IS DISTINCT FROM 'badmin_schema_owner' THEN
    RAISE EXCEPTION 'control schema owner mismatch: %', schema_owner;
  END IF;
END $$;

-- statement-breakpoint
SET LOCAL ROLE badmin_schema_owner;

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS control.clubs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PROVISIONING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_control_clubs_code UNIQUE (code),
  CONSTRAINT ck_control_clubs_code CHECK (
    code ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  ),
  CONSTRAINT ck_control_clubs_name CHECK (
    length(btrim(name)) > 0
  ),
  CONSTRAINT ck_control_clubs_status CHECK (
    status IN ('PROVISIONING', 'ACTIVE', 'GRACE_PERIOD', 'SUSPENDED', 'ARCHIVED')
  )
);

-- statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_control_clubs_status_name
  ON control.clubs (status, lower(name));

-- statement-breakpoint
CREATE TABLE IF NOT EXISTS control.club_entitlements (
  club_id UUID PRIMARY KEY,
  version BIGINT NOT NULL DEFAULT 1,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  limits JSONB NOT NULL DEFAULT '{}'::jsonb,
  valid_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_control_club_entitlements_club
    FOREIGN KEY (club_id) REFERENCES control.clubs(id) ON DELETE RESTRICT,
  CONSTRAINT ck_control_club_entitlements_version CHECK (version > 0),
  CONSTRAINT ck_control_club_entitlements_features_object CHECK (
    jsonb_typeof(features) = 'object'
  ),
  CONSTRAINT ck_control_club_entitlements_limits_object CHECK (
    jsonb_typeof(limits) = 'object'
  )
);

-- statement-breakpoint
CREATE OR REPLACE FUNCTION control.guard_active_club_code_change()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog
AS $$
BEGIN
  IF OLD.status <> 'PROVISIONING' AND NEW.code IS DISTINCT FROM OLD.code THEN
    RAISE EXCEPTION 'Club code is immutable after provisioning';
  END IF;
  RETURN NEW;
END $$;

-- statement-breakpoint
DROP TRIGGER IF EXISTS trg_control_clubs_guard_code ON control.clubs;

-- statement-breakpoint
CREATE TRIGGER trg_control_clubs_guard_code
BEFORE UPDATE OF code ON control.clubs
FOR EACH ROW
EXECUTE FUNCTION control.guard_active_club_code_change();

-- statement-breakpoint
INSERT INTO control.clubs (id, code, name, status)
VALUES (
  'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'::uuid,
  'tt-badminton',
  'TT Badminton',
  'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- statement-breakpoint
DO $$
DECLARE
  legacy control.clubs%ROWTYPE;
BEGIN
  SELECT * INTO legacy
  FROM control.clubs
  WHERE id = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'::uuid;

  IF NOT FOUND
    OR legacy.code <> 'tt-badminton'
    OR legacy.name <> 'TT Badminton'
    OR legacy.status <> 'ACTIVE'
  THEN
    RAISE EXCEPTION 'Legacy Club identity conflicts with the reviewed seed';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM control.clubs
    WHERE code = 'tt-badminton'
      AND id <> 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'::uuid
  ) THEN
    RAISE EXCEPTION 'Legacy Club code is owned by another club';
  END IF;
END $$;

-- statement-breakpoint
INSERT INTO control.club_entitlements (
  club_id,
  version,
  features,
  limits,
  valid_until
)
VALUES (
  'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'::uuid,
  1,
  '{
    "dashboard": true,
    "schedule": true,
    "session.runtime": true,
    "session.completion": true,
    "finance": true,
    "inventory": true,
    "users": true,
    "settings": true
  }'::jsonb,
  '{}'::jsonb,
  NULL
)
ON CONFLICT (club_id) DO NOTHING;

-- statement-breakpoint
DO $$
DECLARE
  entitlement control.club_entitlements%ROWTYPE;
  expected_features jsonb := '{
    "dashboard": true,
    "schedule": true,
    "session.runtime": true,
    "session.completion": true,
    "finance": true,
    "inventory": true,
    "users": true,
    "settings": true
  }'::jsonb;
BEGIN
  SELECT * INTO entitlement
  FROM control.club_entitlements
  WHERE club_id = 'aa1f1aa3-c438-4498-96e9-ab228cd51f4f'::uuid;

  IF NOT FOUND
    OR entitlement.version <> 1
    OR entitlement.features <> expected_features
    OR entitlement.limits <> '{}'::jsonb
    OR entitlement.valid_until IS NOT NULL
  THEN
    RAISE EXCEPTION 'Legacy Club entitlement conflicts with the reviewed seed';
  END IF;
END $$;

-- statement-breakpoint
REVOKE ALL ON SCHEMA control FROM PUBLIC;

-- statement-breakpoint
REVOKE ALL ON ALL TABLES IN SCHEMA control FROM PUBLIC;

-- statement-breakpoint
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA control FROM PUBLIC;

-- statement-breakpoint
GRANT USAGE ON SCHEMA control TO badmin_control_writer, badmin_uat_app;

-- statement-breakpoint
GRANT SELECT, INSERT, UPDATE ON control.clubs, control.club_entitlements
TO badmin_control_writer;

-- statement-breakpoint
GRANT EXECUTE ON FUNCTION control.guard_active_club_code_change()
TO badmin_control_writer;

-- statement-breakpoint
GRANT SELECT (id, code, name, status)
ON control.clubs TO badmin_uat_app;

-- statement-breakpoint
GRANT SELECT (club_id, version)
ON control.club_entitlements TO badmin_uat_app;

-- statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE badmin_schema_owner IN SCHEMA control
REVOKE ALL ON TABLES FROM PUBLIC;

-- statement-breakpoint
ALTER DEFAULT PRIVILEGES FOR ROLE badmin_schema_owner IN SCHEMA control
REVOKE ALL ON FUNCTIONS FROM PUBLIC;

-- statement-breakpoint
RESET ROLE;

-- statement-breakpoint
REVOKE badmin_schema_owner FROM neondb_owner;
