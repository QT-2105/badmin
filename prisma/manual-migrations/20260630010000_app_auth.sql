CREATE TABLE IF NOT EXISTS app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  display_name varchar(255) NOT NULL,
  role varchar(30) NOT NULL DEFAULT 'OPERATOR',
  status varchar(20) NOT NULL DEFAULT 'ACTIVE',
  last_login_at timestamp(6),
  created_at timestamp(6) DEFAULT now(),
  updated_at timestamp(6) DEFAULT now()
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  token_hash varchar(128) NOT NULL UNIQUE,
  expires_at timestamp(6) NOT NULL,
  created_at timestamp(6) DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_user
  ON auth_sessions(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires
  ON auth_sessions(expires_at);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_users_role_check'
  ) THEN
    ALTER TABLE app_users
      ADD CONSTRAINT app_users_role_check
      CHECK (role IN ('OWNER', 'MANAGER', 'OPERATOR', 'VIEWER'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'app_users_status_check'
  ) THEN
    ALTER TABLE app_users
      ADD CONSTRAINT app_users_status_check
      CHECK (status IN ('ACTIVE', 'DISABLED'));
  END IF;
END $$;
