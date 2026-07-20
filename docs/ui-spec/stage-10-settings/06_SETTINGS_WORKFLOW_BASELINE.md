# Settings Workflow Baseline

## Branding Workflow

1. User opens `/settings`.
2. Page loads current branding via `useBranding()`.
3. User edits club name.
4. Save calls `updateBrandingName(clubName)`.
5. API requires `settings.manage`.
6. Repository upserts `app_settings` id `default`.
7. Query `['settings', 'branding']` invalidates on success.

Logo upload/delete follows the same query invalidation path and stays owned by the existing API/repository/S3 utility.

## Local App Settings Workflow

1. `useAppSettings()` reads localStorage on client mount.
2. Toggle/input changes call `setSetting`.
3. `writeAppSettings` writes localStorage immediately.
4. Session detail and play date detail read these settings from the same hook.
5. Session completion sends the two auto-create flags through the existing complete-session payload.

## Maintenance Workflow

1. User opens destructive section.
2. User confirms via current confirmation UI.
3. Settings service calls existing DELETE endpoint.
4. API requires `settings.manage`.
5. Repository performs deletion.
6. Page shows success/error message.

## Protected Workflow

The UI may improve confirmation and feedback, but must not change confirmation requirement, endpoint, permission, payload, deletion scope, or cleanup behavior.

