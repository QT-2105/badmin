-- Phase 13: Control Plane-owned idempotent provisioning and Badmin OWNER activation.
-- Manual execution only after exact target confirmation and Phase 12 grant validation.
-- The provisioning request must contain activation_token_hash and must never contain a password.

BEGIN;
SET LOCAL lock_timeout = '3s';

-- PostgreSQL 18 creates CREATEROLE memberships with SET FALSE. Enable SET only
-- for this transaction so durable control objects are owned by the schema role.
GRANT badmin_schema_owner TO neondb_owner WITH SET TRUE;

-- SECURITY DEFINER provisioning functions run as the NOLOGIN schema owner.
-- Grant only the tenant seed/activation operations required on public tables.
GRANT SELECT, INSERT ON public.app_settings, public.app_role_permissions TO badmin_schema_owner;
GRANT SELECT, INSERT, UPDATE ON public.app_users TO badmin_schema_owner;

ALTER TABLE public.app_role_permissions DROP CONSTRAINT app_role_permissions_pkey;
DROP INDEX IF EXISTS public.uq_role_permissions_club_role;
ALTER TABLE public.app_role_permissions
  ADD CONSTRAINT app_role_permissions_pkey PRIMARY KEY (club_id, role);

CREATE TABLE control.club_provisioning_receipts (
  idempotency_key UUID PRIMARY KEY,
  request_fingerprint CHAR(64) NOT NULL,
  club_id UUID NOT NULL UNIQUE REFERENCES control.clubs(id) ON DELETE RESTRICT,
  owner_user_id UUID NOT NULL UNIQUE REFERENCES public.app_users(id) ON DELETE RESTRICT,
  status VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_provisioning_receipt_status CHECK (status IN ('READY_FOR_OWNER', 'ACTIVE')),
  CONSTRAINT ck_provisioning_receipt_fingerprint CHECK (request_fingerprint ~ '^[a-f0-9]{64}$')
);

CREATE TABLE control.club_owner_activations (
  club_id UUID PRIMARY KEY REFERENCES control.clubs(id) ON DELETE RESTRICT,
  owner_user_id UUID NOT NULL UNIQUE REFERENCES public.app_users(id) ON DELETE RESTRICT,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  activated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT ck_owner_activation_token_hash CHECK (token_hash ~ '^[a-f0-9]{64}$')
);

-- These tables need REFERENCES on public.app_users while being created, so the
-- migration owner creates them and then transfers durable ownership.
ALTER TABLE control.club_provisioning_receipts OWNER TO badmin_schema_owner;
ALTER TABLE control.club_owner_activations OWNER TO badmin_schema_owner;

SET LOCAL ROLE badmin_schema_owner;

CREATE OR REPLACE FUNCTION control.provision_club_tenant(
  p_idempotency_key UUID,
  p_request JSONB
)
RETURNS TABLE (club_id UUID, club_code TEXT, owner_user_id UUID, provisioning_status TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_fingerprint TEXT;
  v_receipt control.club_provisioning_receipts%ROWTYPE;
  v_club_id UUID;
  v_owner_user_id UUID;
  v_club_code TEXT;
  v_club_name TEXT;
  v_owner_display_name TEXT;
  v_token_hash TEXT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  IF p_request IS NULL OR jsonb_typeof(p_request) <> 'object' THEN
    RAISE EXCEPTION 'Invalid provisioning request';
  END IF;
  IF p_request ?| ARRAY['password', 'password_hash', 'plaintext_password'] THEN
    RAISE EXCEPTION 'Provisioning request must not contain a password';
  END IF;

  PERFORM pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_idempotency_key::text, 0));
  v_fingerprint := pg_catalog.md5(p_request::text)
    || pg_catalog.md5('badmin-provisioning:' || p_request::text);

  SELECT r.* INTO v_receipt
  FROM control.club_provisioning_receipts r
  WHERE r.idempotency_key = p_idempotency_key;
  IF FOUND THEN
    IF v_receipt.request_fingerprint <> v_fingerprint THEN
      RAISE EXCEPTION 'Idempotency key payload mismatch';
    END IF;
    RETURN QUERY
      SELECT c.id, c.code::text, v_receipt.owner_user_id, v_receipt.status::text
      FROM control.clubs c WHERE c.id = v_receipt.club_id;
    RETURN;
  END IF;

  v_club_id := (p_request->>'club_id')::uuid;
  v_owner_user_id := (p_request->>'owner_user_id')::uuid;
  v_club_code := lower(btrim(p_request->>'club_code'));
  v_club_name := btrim(p_request->>'club_name');
  v_owner_display_name := btrim(p_request->>'owner_display_name');
  v_token_hash := lower(p_request->>'activation_token_hash');
  v_expires_at := (p_request->>'activation_expires_at')::timestamptz;

  IF v_club_code !~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$'
    OR v_club_name = '' OR length(v_club_name) > 255
    OR v_owner_display_name = '' OR length(v_owner_display_name) > 255
    OR v_token_hash !~ '^[a-f0-9]{64}$'
    OR v_expires_at <= now()
  THEN
    RAISE EXCEPTION 'Invalid provisioning request fields';
  END IF;
  IF coalesce(nullif(p_request->>'owner_username_normalized', ''), nullif(p_request->>'owner_email_normalized', ''), nullif(p_request->>'owner_phone_normalized', '')) IS NULL THEN
    RAISE EXCEPTION 'Owner requires at least one normalized identifier';
  END IF;
  IF jsonb_typeof(coalesce(p_request->'features', '{}'::jsonb)) <> 'object'
    OR jsonb_typeof(coalesce(p_request->'limits', '{}'::jsonb)) <> 'object'
  THEN
    RAISE EXCEPTION 'Features and limits must be objects';
  END IF;

  INSERT INTO control.clubs (id, code, name, status)
  VALUES (v_club_id, v_club_code, v_club_name, 'PROVISIONING');

  INSERT INTO control.club_entitlements (club_id, version, features, limits, valid_until)
  VALUES (v_club_id, 1, coalesce(p_request->'features', '{}'::jsonb), coalesce(p_request->'limits', '{}'::jsonb), (p_request->>'entitlement_valid_until')::timestamptz);

  INSERT INTO public.app_settings (
    id, club_id, club_name, max_court_count_per_session,
    auto_create_court_fee_transaction, auto_create_shuttlecock_usage_transaction
  ) VALUES (v_club_id::text, v_club_id, v_club_name, 3, false, true);

  INSERT INTO public.app_role_permissions (club_id, role, permissions) VALUES
    (v_club_id, 'MANAGER', '["dashboard.view","schedule.view","schedule.manage","session.view","session.operate","session.complete","finance.view","finance.manage","inventory.view","inventory.manage"]'::jsonb),
    (v_club_id, 'OPERATOR', '["dashboard.view","schedule.view","session.view","session.operate","inventory.view"]'::jsonb),
    (v_club_id, 'VIEWER', '["dashboard.view","schedule.view","session.view","finance.view","inventory.view"]'::jsonb);

  INSERT INTO public.app_users (
    id, club_id, username, username_normalized, email, email_normalized,
    phone, phone_normalized, password_hash, display_name, role, status
  ) VALUES (
    v_owner_user_id, v_club_id,
    nullif(p_request->>'owner_username', ''), nullif(p_request->>'owner_username_normalized', ''),
    nullif(p_request->>'owner_email', ''), nullif(p_request->>'owner_email_normalized', ''),
    nullif(p_request->>'owner_phone', ''), nullif(p_request->>'owner_phone_normalized', ''),
    'activation-pending:'
      || pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', '')
      || pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''),
    v_owner_display_name, 'OWNER', 'DISABLED'
  );

  INSERT INTO control.club_owner_activations (club_id, owner_user_id, token_hash, expires_at)
  VALUES (v_club_id, v_owner_user_id, v_token_hash, v_expires_at);

  INSERT INTO control.club_provisioning_receipts (
    idempotency_key, request_fingerprint, club_id, owner_user_id, status
  ) VALUES (p_idempotency_key, v_fingerprint, v_club_id, v_owner_user_id, 'READY_FOR_OWNER');

  RETURN QUERY SELECT v_club_id, v_club_code, v_owner_user_id, 'READY_FOR_OWNER'::text;
END $$;

CREATE OR REPLACE FUNCTION control.activate_club_owner(
  p_club_code TEXT,
  p_token_hash TEXT,
  p_password_hash TEXT
)
RETURNS TABLE (club_id UUID, club_code TEXT, user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_activation control.club_owner_activations%ROWTYPE;
  v_receipt control.club_provisioning_receipts%ROWTYPE;
  v_status TEXT;
BEGIN
  IF p_token_hash !~ '^[a-f0-9]{64}$' OR p_password_hash !~ '^scrypt:[a-f0-9]+:[a-f0-9]+$' THEN
    RAISE EXCEPTION 'Invalid activation credentials';
  END IF;

  SELECT a.* INTO v_activation
  FROM control.club_owner_activations a
  JOIN control.clubs c ON c.id = a.club_id
  WHERE a.token_hash = p_token_hash AND c.code = lower(btrim(p_club_code))
  FOR UPDATE OF a;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid activation credentials'; END IF;

  SELECT r.* INTO v_receipt
  FROM control.club_provisioning_receipts r
  WHERE r.club_id = v_activation.club_id
  FOR UPDATE;
  SELECT c.status INTO v_status
  FROM control.clubs c
  WHERE c.id = v_activation.club_id
  FOR UPDATE;

  IF v_activation.activated_at IS NOT NULL THEN
    IF v_receipt.status = 'ACTIVE' AND v_status = 'ACTIVE' THEN
      RETURN QUERY SELECT v_activation.club_id, lower(btrim(p_club_code)), v_activation.owner_user_id;
      RETURN;
    END IF;
    RAISE EXCEPTION 'Activation state mismatch';
  END IF;
  IF v_activation.expires_at <= now() OR v_receipt.status <> 'READY_FOR_OWNER' OR v_status <> 'PROVISIONING' THEN
    RAISE EXCEPTION 'Invalid activation state';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM control.club_entitlements e WHERE e.club_id = v_activation.club_id)
    OR NOT EXISTS (SELECT 1 FROM public.app_settings s WHERE s.club_id = v_activation.club_id)
    OR (SELECT count(*) FROM public.app_role_permissions rp WHERE rp.club_id = v_activation.club_id AND rp.role IN ('MANAGER','OPERATOR','VIEWER')) <> 3
    OR NOT EXISTS (
      SELECT 1 FROM public.app_users u
      WHERE u.id = v_activation.owner_user_id AND u.club_id = v_activation.club_id AND u.role = 'OWNER' AND u.status = 'DISABLED'
    )
  THEN
    RAISE EXCEPTION 'Provisioning is incomplete';
  END IF;

  UPDATE public.app_users u
  SET password_hash = p_password_hash, status = 'ACTIVE', updated_at = now()
  WHERE u.id = v_activation.owner_user_id AND u.club_id = v_activation.club_id;
  UPDATE control.club_owner_activations a
  SET activated_at = now()
  WHERE a.club_id = v_activation.club_id;
  UPDATE control.club_provisioning_receipts r
  SET status = 'ACTIVE', updated_at = now()
  WHERE r.club_id = v_activation.club_id;
  -- This is deliberately last. Any earlier failure rolls the whole activation back.
  UPDATE control.clubs c
  SET status = 'ACTIVE', updated_at = now()
  WHERE c.id = v_activation.club_id;

  RETURN QUERY SELECT v_activation.club_id, lower(btrim(p_club_code)), v_activation.owner_user_id;
END $$;

-- Control Plane may rotate an expired/lost activation token without reseeding the tenant.
CREATE OR REPLACE FUNCTION control.reissue_club_owner_activation(
  p_club_code TEXT,
  p_token_hash TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS TABLE (club_id UUID, owner_user_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
  v_activation control.club_owner_activations%ROWTYPE;
BEGIN
  IF p_token_hash !~ '^[a-f0-9]{64}$' OR p_expires_at <= now() THEN
    RAISE EXCEPTION 'Invalid activation rotation';
  END IF;
  SELECT a.* INTO v_activation
  FROM control.club_owner_activations a
  JOIN control.clubs c ON c.id = a.club_id
  JOIN control.club_provisioning_receipts r ON r.club_id = a.club_id
  WHERE c.code = lower(btrim(p_club_code))
    AND c.status = 'PROVISIONING'
    AND r.status = 'READY_FOR_OWNER'
    AND a.activated_at IS NULL
  FOR UPDATE OF a;
  IF NOT FOUND THEN RAISE EXCEPTION 'Activation cannot be rotated'; END IF;

  UPDATE control.club_owner_activations a
  SET token_hash = p_token_hash, expires_at = p_expires_at
  WHERE a.club_id = v_activation.club_id;
  RETURN QUERY SELECT v_activation.club_id, v_activation.owner_user_id;
END $$;

REVOKE ALL ON FUNCTION control.provision_club_tenant(UUID, JSONB) FROM PUBLIC;
REVOKE ALL ON FUNCTION control.activate_club_owner(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION control.reissue_club_owner_activation(TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION control.provision_club_tenant(UUID, JSONB) TO badmin_control_writer;
GRANT EXECUTE ON FUNCTION control.activate_club_owner(TEXT, TEXT, TEXT) TO badmin_uat_app;
GRANT EXECUTE ON FUNCTION control.reissue_club_owner_activation(TEXT, TEXT, TIMESTAMPTZ) TO badmin_control_writer;

RESET ROLE;
GRANT badmin_schema_owner TO neondb_owner WITH SET FALSE;

COMMIT;
