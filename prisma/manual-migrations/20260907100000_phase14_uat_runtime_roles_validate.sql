DO $$
DECLARE
  missing_privileges TEXT[];
BEGIN
  SELECT array_agg(table_name ORDER BY table_name)
  INTO missing_privileges
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN (
      'app_role_permissions', 'app_settings', 'app_users', 'auth_sessions',
      'match_histories', 'match_history_players', 'payment_bank_accounts',
      'play_dates', 'play_sessions', 'runtime_courts', 'runtime_matches',
      'session_player_images', 'session_players', 'session_summaries',
      'session_transactions', 'shuttlecock_inventory', 'shuttlecock_movements',
      'shuttlecock_products'
    )
    AND NOT (
      has_table_privilege('badmin_uat_app', format('%I.%I', table_schema, table_name), 'SELECT')
      AND has_table_privilege('badmin_uat_app', format('%I.%I', table_schema, table_name), 'INSERT')
      AND has_table_privilege('badmin_uat_app', format('%I.%I', table_schema, table_name), 'UPDATE')
      AND has_table_privilege('badmin_uat_app', format('%I.%I', table_schema, table_name), 'DELETE')
    );
  IF missing_privileges IS NOT NULL THEN
    RAISE EXCEPTION 'Badmin runtime privileges missing for: %', missing_privileges;
  END IF;

  IF has_table_privilege('badmin_uat_app', 'control.clubs', 'INSERT,UPDATE,DELETE')
    OR has_table_privilege('badmin_uat_app', 'control.club_entitlements', 'INSERT,UPDATE,DELETE')
  THEN
    RAISE EXCEPTION 'Badmin runtime can mutate Control Plane projections';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_auth_members membership
    JOIN pg_roles member ON member.oid = membership.member
    JOIN pg_roles granted ON granted.oid = membership.roleid
    WHERE member.rolname = 'neondb_owner'
      AND granted.rolname = 'badmin_uat_app'
      AND membership.set_option
  ) THEN
    RAISE EXCEPTION 'UAT login cannot SET ROLE badmin_uat_app';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_auth_members membership
    JOIN pg_roles member ON member.oid = membership.member
    JOIN pg_roles granted ON granted.oid = membership.roleid
    WHERE member.rolname = 'neondb_owner'
      AND granted.rolname = 'badmin_control_writer'
      AND membership.set_option
  ) THEN
    RAISE EXCEPTION 'UAT login cannot SET ROLE badmin_control_writer';
  END IF;
END $$;
