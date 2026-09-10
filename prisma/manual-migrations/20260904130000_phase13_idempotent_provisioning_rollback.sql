-- Destructive rollback guard: remove synthetic receipts explicitly before running.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM control.club_provisioning_receipts) THEN
    RAISE EXCEPTION 'Refusing rollback while provisioned tenant receipts exist';
  END IF;
END $$;

BEGIN;
GRANT badmin_schema_owner TO neondb_owner WITH SET TRUE;
SET LOCAL ROLE badmin_schema_owner;
DROP FUNCTION IF EXISTS control.reissue_club_owner_activation(TEXT, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS control.activate_club_owner(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS control.provision_club_tenant(UUID, JSONB);
DROP TABLE IF EXISTS control.club_owner_activations;
DROP TABLE IF EXISTS control.club_provisioning_receipts;
RESET ROLE;
ALTER TABLE public.app_role_permissions DROP CONSTRAINT app_role_permissions_pkey;
ALTER TABLE public.app_role_permissions ADD CONSTRAINT app_role_permissions_pkey PRIMARY KEY (role);
CREATE UNIQUE INDEX uq_role_permissions_club_role ON public.app_role_permissions (club_id, role);
REVOKE SELECT, INSERT ON public.app_settings, public.app_role_permissions FROM badmin_schema_owner;
REVOKE SELECT, INSERT, UPDATE ON public.app_users FROM badmin_schema_owner;
GRANT badmin_schema_owner TO neondb_owner WITH SET FALSE;
COMMIT;
