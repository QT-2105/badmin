CREATE TABLE IF NOT EXISTS app_role_permissions (
  role varchar(30) PRIMARY KEY,
  permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamp(6) DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_role_permissions_role_check'
  ) THEN
    ALTER TABLE app_role_permissions
      ADD CONSTRAINT app_role_permissions_role_check
      CHECK (role IN ('OWNER', 'MANAGER', 'OPERATOR', 'VIEWER'));
  END IF;
END $$;
