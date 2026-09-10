-- Run outside a transaction, one statement at a time.
CREATE UNIQUE INDEX CONCURRENTLY uq_app_users_club_username_normalized
  ON public.app_users (club_id, username_normalized);
CREATE UNIQUE INDEX CONCURRENTLY uq_app_users_club_email_normalized
  ON public.app_users (club_id, email_normalized);
CREATE UNIQUE INDEX CONCURRENTLY uq_app_users_club_phone_normalized
  ON public.app_users (club_id, phone_normalized);
