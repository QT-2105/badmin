-- Run as the migration owner. This is metadata-only validation.

DO $$
DECLARE
  missing_columns text[];
BEGIN
  SELECT array_agg(required.column_name ORDER BY required.column_name)
  INTO missing_columns
  FROM (VALUES
    ('club_id'), ('features'), ('limits'), ('updated_at'), ('valid_until'), ('version')
  ) AS required(column_name)
  WHERE NOT has_column_privilege(
    'badmin_uat_app',
    'control.club_entitlements',
    required.column_name,
    'SELECT'
  );

  IF missing_columns IS NOT NULL THEN
    RAISE EXCEPTION 'Badmin entitlement projection grants are missing: %', missing_columns;
  END IF;
END $$;
