# Discovery Audit Current Audit

Status: COMPLETE / PASS WITH NOTES

## Findings

- Settings route exists at `/settings` via `src/app/settings/page.tsx`.
- Settings UI exists at `src/components/settings/settings-page-client.tsx`.
- Club branding is server persisted through `app_settings` and S3.
- Local preferences are browser-local through `badmin_app_settings`.
- Destructive maintenance actions exist for match history reset and player image cleanup.
- Environment/build configuration is read-only from source/deployment.
- Notifications, backup/restore, export/import, feature flags, and security settings are missing capabilities.

## Source Discovery

| Category | Source found | Classification |
| --- | --- | --- |
| Settings routes | `src/app/settings/page.tsx` | AVAILABLE |
| Settings pages | `src/components/settings/settings-page-client.tsx` | AVAILABLE |
| Config components | `SettingsCard`, `SettingToggle`, `BrandLogo`, shared form/button/page primitives | AVAILABLE |
| Configuration models | `app_settings` model only for branding | PARTIAL |
| Configuration API | Branding, logo, player-images cleanup, match-history reset routes | PARTIAL |
| Configuration repositories | `branding-repository`, `player-images-repository`, `match-history-repository` | PARTIAL |
| Configuration services | `branding-service`, `settings-service` | PARTIAL |
| Configuration hooks | `useBranding`, `useBrandingMutations`, `useAppSettings` | AVAILABLE |
| Query keys | `['settings', 'branding']` | READ_ONLY |
| Mutations | Branding mutations only; maintenance services call endpoints directly | READ_ONLY |
| Validation schemas | No schema file; validation lives in helpers/repository/API utilities | PARTIAL |
| Environment variables | DB, app URL, S3, Node environment | READ_ONLY |
| Config files | `next.config.mjs`, Docker/deploy workflow files, Prisma env datasource | READ_ONLY |
| Constants | app setting defaults, image upload limits, auth constants, runtime scoring constants | READ_ONLY unless already exposed |
| Feature flags | No feature flag registry/source found | MISSING |
| User preferences | Local app settings, sidebar collapsed, theme toggle | PARTIAL |
| Local storage usage | `badmin_app_settings`, `badmin_sidebar_collapsed`, `badmin_theme`, `badmin_active_session_id` | PARTIAL / READ_ONLY by owner module |
| Cookie preferences | Auth cookie behavior exists, security-owned | READ_ONLY |
| Server defaults | `app_settings` default id/name, session max age, Prisma logging by env | READ_ONLY |
| Client defaults | app settings defaults and theme default | PARTIAL |
| Hard-coded values | Several protected constants exist | READ_ONLY |
| Magic numbers/strings | `1..12` court clamp, `3` max court default, `24h` auth session, `3MB` image upload, S3 prefixes, role/permission keys | READ_ONLY or AVAILABLE only where already exposed |

## Audit By Group

1. General application settings: no generic registry; only current Settings page.
2. Club profile: available for name/logo.
3. Schedule defaults: max court count only.
4. Session defaults: max court count and completion auto-create preferences.
5. Runtime settings: missing as Settings; runtime constants are protected.
6. Finance settings: auto-create court fee and shuttle usage transaction preferences only.
7. Inventory settings: no inventory calculation settings; image cleanup maintenance exists.
8. Appearance preferences: theme/sidebar/fullscreen exist outside Settings; partial.
9. Notification settings: missing.
10. Data export/import: missing.
11. Backup/restore: missing.
12. Security settings: missing in Settings; auth/user management is separate.
13. About/system information: missing; env/build data is read-only.

## UI Audit

- Layout: single-page section list with collapsible cards.
- Navigation: no internal navigation or category rail.
- Page header: present through `PageHeader`.
- Section hierarchy: functional, but local/server/destructive settings need stronger differentiation.
- Forms: club name, logo upload, max court count, two toggles.
- Labels/helper text: present, can be tightened to clarify storage and operational impact.
- Save behavior: only club name has explicit save; local settings save immediately.
- Reset behavior: no reset-to-default handler exists and must not be invented.
- Dirty state: not explicit for club name.
- Loading: mutation loading exists for branding and destructive actions.
- Empty: not applicable for current settings.
- Error/success: local string messages for destructive actions; branding errors owned by mutation behavior.
- Confirmation: native `window.confirm` for destructive actions.
- Permission: page/API guarded by `settings.manage`.
- Light/dark: uses semantic tokens, but destructive confirmation is native browser UI.
- Desktop/tablet/mobile: compact cards exist; implementation QA still required.
- Keyboard/focus/contrast: native controls are usable; shared Dialog replacement would need focus return validation.
- Shared components: uses shared page/form/button primitives but custom Settings card remains.

## Classification

### P0

- A future UI that shows read-only or missing capability as editable would be P0.
- A future save/reset control without an existing handler would be P0.
- Destructive actions need strong warning and confirmation presentation if refactored.

### P1

- Information architecture needs clearer server/local/destructive grouping.
- Settings navigation is minimal.
- Form grouping and save hierarchy can be clearer.
- Existing custom section card can migrate closer to shared primitives.

### P2

- Hover/focus polish.
- Motion consistency.
- Copy tightening and visual density.
