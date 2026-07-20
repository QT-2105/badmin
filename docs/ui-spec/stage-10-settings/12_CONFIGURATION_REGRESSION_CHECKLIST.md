# Configuration Regression Checklist

## Branding

- Club name loads.
- Club name saves.
- Empty club name still follows existing validation.
- Logo uploads.
- Logo deletes.
- Branding query invalidates after mutation.
- Unauthorized write remains blocked by `settings.manage`.

## Local Preferences

- Auto court fee toggle persists to `badmin_app_settings`.
- Auto shuttle usage toggle persists to `badmin_app_settings`.
- Max court count persists to `badmin_app_settings`.
- Max court count still clamps from 1 to 12.
- Session creation still uses max court count.
- Session completion still receives existing auto-create flags.

## Maintenance

- Reset match history still requires confirmation.
- Reset match history still calls existing endpoint.
- Delete player images still requires confirmation.
- Delete player images still calls existing endpoint.
- Error and success states remain visible.

## Platform

- `/settings` route guard remains active.
- `settings.manage` route/API permission remains unchanged.
- No API/database/repository/service changes.
- Light and dark modes remain readable.
- Tablet and mobile have no page-level horizontal overflow.

