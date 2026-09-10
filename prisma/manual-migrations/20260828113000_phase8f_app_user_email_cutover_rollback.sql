-- Before rolling back to the old email-only application, populate its required
-- compatibility value, rebuild global uniqueness, then restore NOT NULL.
UPDATE public.app_users
SET email = COALESCE(NULLIF(btrim(email), ''), username, phone)
WHERE email IS NULL OR btrim(email) = '';

CREATE UNIQUE INDEX CONCURRENTLY app_users_email_key_rebuild
  ON public.app_users (email);

ALTER TABLE public.app_users
  ADD CONSTRAINT app_users_email_key UNIQUE USING INDEX app_users_email_key_rebuild;

ALTER TABLE public.app_users ALTER COLUMN email SET NOT NULL;
