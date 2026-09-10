-- Read-only validation for Phase 4A.
SELECT
  table_name,
  data_type,
  is_nullable,
  column_default,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'club_id'
  AND table_name IN (
    'app_users', 'auth_sessions', 'app_role_permissions',
    'app_settings', 'payment_bank_accounts'
  )
ORDER BY table_name;

-- statement-breakpoint
SELECT 'app_users' AS table_name, count(*) AS row_count,
       count(club_id) AS populated_club_id_count FROM public.app_users
UNION ALL SELECT 'auth_sessions', count(*), count(club_id) FROM public.auth_sessions
UNION ALL SELECT 'app_role_permissions', count(*), count(club_id) FROM public.app_role_permissions
UNION ALL SELECT 'app_settings', count(*), count(club_id) FROM public.app_settings
UNION ALL SELECT 'payment_bank_accounts', count(*), count(club_id) FROM public.payment_bank_accounts
ORDER BY table_name;
