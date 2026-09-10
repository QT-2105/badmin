DO $$
BEGIN
  IF NOT has_function_privilege('badmin_control_writer', 'control.provision_club_tenant(uuid,jsonb)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Control Plane provisioning EXECUTE grant is missing';
  END IF;
  IF NOT has_function_privilege('badmin_uat_app', 'control.activate_club_owner(text,text,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Badmin activation EXECUTE grant is missing';
  END IF;
  IF NOT has_function_privilege('badmin_control_writer', 'control.reissue_club_owner_activation(text,text,timestamp with time zone)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Control Plane activation reissue EXECUTE grant is missing';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.app_role_permissions'::regclass
      AND conname = 'app_role_permissions_pkey'
      AND pg_get_constraintdef(oid) = 'PRIMARY KEY (club_id, role)'
  ) THEN
    RAISE EXCEPTION 'Role permission primary key is not tenant-scoped';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'control' AND p.proname = 'provision_club_tenant'
      AND p.prosecdef
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'control' AND p.proname = 'activate_club_owner'
      AND p.prosecdef
  ) OR NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'control' AND p.proname = 'reissue_club_owner_activation'
      AND p.prosecdef
  ) THEN
    RAISE EXCEPTION 'Provisioning functions must remain SECURITY DEFINER';
  END IF;
  IF has_table_privilege('badmin_uat_app', 'control.club_provisioning_receipts', 'INSERT')
    OR has_table_privilege('badmin_uat_app', 'control.club_provisioning_receipts', 'UPDATE')
    OR has_table_privilege('badmin_uat_app', 'control.club_provisioning_receipts', 'DELETE')
    OR has_table_privilege('badmin_uat_app', 'control.club_owner_activations', 'INSERT')
    OR has_table_privilege('badmin_uat_app', 'control.club_owner_activations', 'UPDATE')
    OR has_table_privilege('badmin_uat_app', 'control.club_owner_activations', 'DELETE')
  THEN
    RAISE EXCEPTION 'Badmin runtime role has direct provisioning table mutation rights';
  END IF;
  IF NOT has_table_privilege('badmin_schema_owner', 'public.app_settings', 'SELECT,INSERT')
    OR NOT has_table_privilege('badmin_schema_owner', 'public.app_role_permissions', 'SELECT,INSERT')
    OR NOT has_table_privilege('badmin_schema_owner', 'public.app_users', 'SELECT,INSERT,UPDATE')
    OR has_table_privilege('badmin_schema_owner', 'public.app_settings', 'DELETE')
    OR has_table_privilege('badmin_schema_owner', 'public.app_role_permissions', 'DELETE')
    OR has_table_privilege('badmin_schema_owner', 'public.app_users', 'DELETE')
  THEN
    RAISE EXCEPTION 'Provisioning function owner public-table privileges are invalid';
  END IF;
END $$;
