# Current Settings Audit

## Route And Guard

- `/settings` renders `src/app/settings/page.tsx`.
- Page access calls `requirePageUser('/settings')`.
- Route permission is `settings.manage`.

## Current Page Structure

The current Settings page uses:

- `PageShell`
- `PageHeader`
- custom `SettingsCard`
- `Button`
- `Input`
- `Switch`
- `BrandLogo`

All sections are collapsed by default:

- `branding`
- `finance`
- `schedule`
- `history`
- `images`

## Current Capabilities

### Club Branding

- Reads via `useBranding()` and query key `['settings', 'branding']`.
- Saves club name via `PUT /api/settings/branding`.
- Uploads logo via `POST /api/settings/branding/logo`.
- Deletes logo via `DELETE /api/settings/branding/logo`.
- Uses `app_settings.club_name`, `logo_s3_key`, and `logo_url`.

### Local Operational Preferences

- Uses `useAppSettings()` with browser `localStorage`.
- Stores values under `badmin_app_settings`.
- Values affect session creation and session completion behavior through existing callers.

### Destructive Maintenance

- Reset match history uses `DELETE /api/match-history/reset`.
- Delete player images uses `DELETE /api/settings/player-images`.
- Both use `window.confirm` currently.

## UI Issues

## Source Discovery

| Area | Findings | Capability decision |
| --- | --- | --- |
| Settings routes | `/settings` route exists and is guarded by `requirePageUser('/settings')`. | AVAILABLE |
| Settings pages | `SettingsPageClient` contains all current Settings UI. | AVAILABLE |
| Config components | Custom `SettingsCard`, `SettingToggle`, shared `Button`, `Input`, `Switch`, `PageShell`, `PageHeader`, and `BrandLogo`. | AVAILABLE |
| Configuration models | `app_settings` stores `club_name`, `logo_s3_key`, `logo_url`; local app settings are not database-backed. | PARTIAL |
| Configuration API | `/api/settings/branding`, `/api/settings/branding/logo`, `/api/settings/player-images`, `/api/match-history/reset`. | PARTIAL |
| Configuration repositories | Branding, player image cleanup, and match history reset repositories support current actions. | PARTIAL |
| Configuration services | `branding-service.ts` and `settings-service.ts`. | PARTIAL |
| Configuration hooks | `useBranding`, `useBrandingMutations`, `useAppSettings`. | AVAILABLE |
| Query keys | Branding query key is `['settings', 'branding']`. | READ_ONLY |
| Mutations | Branding name/logo mutations exist; maintenance actions call services directly. | READ_ONLY |
| Validation schemas | No separate schema found; validation is in helpers/repositories/API utility functions. | PARTIAL |
| Environment variables | Database, S3, app URL, Node environment are env/deployment-owned. | READ_ONLY |
| Config files | `next.config.mjs`, `Dockerfile`, workflows, Prisma datasource env. | READ_ONLY |
| Constants | Local setting defaults, image upload limits, auth session/cookie constants, route permission rules, runtime scoring constants. | READ_ONLY unless already exposed as local preference |
| Feature flags | No feature flag system found. | MISSING |
| User preferences | Local app settings, sidebar collapsed state, theme toggle. | PARTIAL |
| Local storage usage | `badmin_app_settings`, `badmin_sidebar_collapsed`, `badmin_theme`, `badmin_active_session_id`. | PARTIAL / READ_ONLY by module |
| Cookie preferences | Auth cookie behavior exists but is security-owned. | READ_ONLY |
| Server defaults | `app_settings` default id/name, auth session max age, Prisma logging by env. | READ_ONLY |
| Client defaults | Default app settings and theme default. | PARTIAL |
| Hard-coded values | Defaults and protected constants exist. Do not convert to dynamic settings in Stage 10. | READ_ONLY |

## Audit By Group

1. General application settings: only current Settings landing/page exists; no generic config registry.
2. Club profile: available for club name and logo.
3. Schedule defaults: partial, max court count only.
4. Session defaults: partial, max court count plus completion toggles affect session workflows.
5. Runtime settings: missing as settings; protected runtime constants are read-only.
6. Finance settings: partial, auto-create court fee/shuttle usage transaction toggles only.
7. Inventory settings: partial, image cleanup maintenance only; no stock/cost/conversion settings.
8. Appearance preferences: partial, theme/fullscreen/sidebar controls exist outside Settings.
9. Notification settings: missing.
10. Data export/import: missing.
11. Backup/restore: missing.
12. Security settings: missing in Settings; auth/user management is separate and protected.
13. About/system information: missing; env/build configuration is read-only.

### P0

- Destructive actions rely on native `window.confirm`; this is functional but weaker than shared confirmation presentation and not ideal for consistent focus/contrast review.
- Settings page must keep destructive actions visibly separated from normal configuration to reduce operational mistakes.
- Any future UI that suggests read-only/missing configuration is editable would be a P0 violation.
- Any future save/reset UI without an existing handler would be a P0 violation.

### P1

- Custom `SettingsCard` partially duplicates shared surface/header patterns.
- Settings sections use similar collapsible behavior but not a shared settings-section primitive.
- Local browser settings and persisted server settings are not visually distinguished enough.
- `READ_ONLY` and `MISSING` configuration categories are not documented in UI because the page only shows existing controls.
- There is no internal Settings navigation for the five existing sections.
- Dirty state is not explicit for club name edits.

### P2

- Helper text can be tightened for operational clarity.
- Success/error feedback can be made more consistent with shared feedback primitives.
- Logo upload/delete can use a cleaner action group and clearer disabled/loading treatment.
- Hover/focus polish can be improved for collapsible section controls.

## Protected Areas Observed

Settings UI is connected to protected repository/service/API behavior. Stage 10 must not alter those contracts.
