# Capability Discovery Gate

## Capability Matrix

| Capability | Status | Current source | Stage 10 decision |
| --- | --- | --- | --- |
| Settings route | AVAILABLE | `src/app/settings/page.tsx` | Presentation may be refined. |
| Settings page | AVAILABLE | `src/components/settings/settings-page-client.tsx` | Presentation may be refined. |
| Club profile name | AVAILABLE | `app_settings.club_name`, `/api/settings/branding` | Editable UI can be improved; key, payload, validation unchanged. |
| Club logo | AVAILABLE | `app_settings.logo_*`, S3 key under `config/logo/...` | Upload/delete presentation may be improved; storage logic unchanged. |
| Auto court fee voucher | AVAILABLE | `localStorage` key `badmin_app_settings.autoCreateCourtFeeTransaction` | Toggle presentation may be improved; default and behavior unchanged. |
| Auto shuttle usage voucher | AVAILABLE | `localStorage` key `badmin_app_settings.autoCreateShuttlecockUsageTransaction` | Toggle presentation may be improved; default and behavior unchanged. |
| Max court count per session | AVAILABLE | `localStorage` key `badmin_app_settings.maxCourtCountPerSession` | Input presentation may be improved; min/max/normalization unchanged. |
| Reset match history | AVAILABLE | `/api/match-history/reset`, `resetMatchHistory()` | Confirmation and feedback presentation may be improved; delete logic unchanged. |
| Delete player images | AVAILABLE | `/api/settings/player-images`, `deleteAllPlayerImages()` | Confirmation and feedback presentation may be improved; cleanup logic unchanged. |
| Environment variables | READ_ONLY | `src/lib/s3-storage.ts`, auth/session/prisma env reads, deployment files | May document only; no editable UI. |
| Build-time configuration | READ_ONLY | `next.config.mjs`, `Dockerfile`, workflows | May document only; no editable UI. |
| Feature flags | MISSING | No feature flag model/API/UI found | Future scope only. |
| User preferences | PARTIAL | Local app settings and existing theme/fullscreen controls outside Settings | Only existing Settings-local preferences are in scope. |
| Appearance preferences | PARTIAL | Theme exists in app shell/layout behavior, not as Settings backend | Future presentation only after explicit scope; no new setting. |
| Schedule/session defaults | PARTIAL | Max court count setting affects create/edit session UI | Existing max court setting only. |
| Runtime settings | PARTIAL | Max court count indirectly affects session creation; runtime algorithm is protected | No runtime algorithm setting. |
| Finance settings | PARTIAL | Auto-create court fee and shuttle usage toggles passed to session completion | Existing toggles only. |
| Inventory settings | PARTIAL | Player-image cleanup and shuttle usage transaction toggle only | No inventory calculation settings. |
| Notification settings | MISSING | No notification capability found | Future scope only. |
| Export/import capability | MISSING | No settings export/import found | Future scope only. |
| Backup/restore capability | MISSING | No backup/restore capability found | Future scope only. |
| Security settings | MISSING | Auth/users handled separately; no settings security surface | Future scope only; do not add in Stage 10. |
| Sidebar preference | PARTIAL | `src/components/app-shell.tsx`, localStorage key `badmin_sidebar_collapsed` | Existing app-shell preference only; no Settings form unless explicitly approved. |
| Theme preference | PARTIAL | `src/components/ui/theme-toggle.tsx`, localStorage key `badmin_theme` | Existing toggle only; no Settings appearance panel unless implementation plan keeps behavior unchanged. |
| Fullscreen preference | PARTIAL | `src/components/ui/fullscreen-toggle.tsx`, browser Fullscreen API | Existing control only; no persisted Settings field. |
| Active runtime session id | READ_ONLY | `badmin_active_session_id` in runtime route/dashboard | Runtime recovery state; not Settings scope. |
| Auth session max age | READ_ONLY | `SESSION_MAX_AGE_SECONDS = 24 * 60 * 60` | Security constant; do not expose/edit in Settings. |
| Auth cookie name/flags | READ_ONLY | `src/lib/auth/constants.ts`, `src/lib/auth/session.ts` | Security constant; do not expose/edit in Settings. |
| Image upload types/size | READ_ONLY | `src/lib/image-upload.ts` | Validation constant; do not change in Stage 10. |
| Runtime scoring constants | READ_ONLY | `src/lib/badminton-store.ts` | Protected runtime algorithm; not Settings scope. |
| Role/permission defaults | READ_ONLY | `src/lib/auth/permissions.ts`, `src/repositories/role-permissions-repository.ts` | Managed by Stage 09/User module; not Settings scope. |

## Source Discovery Summary

- Settings route and page exist.
- Configuration API exists only for branding and destructive maintenance.
- Configuration repository exists only for branding plus cleanup/reset repositories.
- Local browser preferences exist for app settings, sidebar collapsed state, and theme.
- No generic config service, settings registry, feature-flag registry, notification backend, backup/restore backend, or export/import settings capability exists.
- Environment/build configuration is source/deployment-owned and read-only from app UI.

## Discovery Decision

Stage 10 implementation can safely target existing Settings presentation. Any request to add missing capability requires a separate architecture/security/product approval.
