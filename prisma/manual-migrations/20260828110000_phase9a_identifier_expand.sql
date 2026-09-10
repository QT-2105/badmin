-- Phase 9A - identifier expansion/backfill on confirmed UAT.
-- Run in one reviewed transaction with lock_timeout=2s.

ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS username varchar(80);
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS username_normalized varchar(80);
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS email_normalized varchar(320);
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS phone varchar(32);
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS phone_normalized varchar(20);
ALTER TABLE public.app_users ALTER COLUMN email TYPE varchar(320);

UPDATE public.app_users
SET
  username = CASE
    WHEN email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN username
    ELSE COALESCE(username, btrim(email))
  END,
  username_normalized = CASE
    WHEN email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN username_normalized
    ELSE COALESCE(username_normalized, lower(btrim(email)))
  END,
  email_normalized = CASE
    WHEN email ~* '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' THEN COALESCE(email_normalized, lower(btrim(email)))
    ELSE email_normalized
  END
WHERE username_normalized IS NULL AND email_normalized IS NULL AND phone_normalized IS NULL;

ALTER TABLE public.app_users ALTER COLUMN email DROP NOT NULL;

ALTER TABLE public.app_users ADD CONSTRAINT ck_app_users_identifier_required
  CHECK (username_normalized IS NOT NULL OR email_normalized IS NOT NULL OR phone_normalized IS NOT NULL) NOT VALID;
ALTER TABLE public.app_users ADD CONSTRAINT ck_app_users_username_pair
  CHECK ((username IS NULL) = (username_normalized IS NULL)) NOT VALID;
ALTER TABLE public.app_users ADD CONSTRAINT ck_app_users_email_normalized_source
  CHECK (email_normalized IS NULL OR email IS NOT NULL) NOT VALID;
ALTER TABLE public.app_users ADD CONSTRAINT ck_app_users_phone_pair
  CHECK ((phone IS NULL) = (phone_normalized IS NULL)) NOT VALID;
