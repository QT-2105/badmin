-- Repair an already-applied Phase 13 function on PostgreSQL installations
-- without pgcrypto. A clean install uses the corrected Phase 13 source.
BEGIN;
GRANT badmin_schema_owner TO neondb_owner WITH SET TRUE;
GRANT SELECT, INSERT ON public.app_settings, public.app_role_permissions TO badmin_schema_owner;
GRANT SELECT, INSERT, UPDATE ON public.app_users TO badmin_schema_owner;
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

RESET ROLE;
GRANT badmin_schema_owner TO neondb_owner WITH SET FALSE;
COMMIT;
