# Security and Destructive Actions Current Audit

Status: NOT STARTED / LIMITED

## Source Audit Summary

- `/settings` is protected by `requirePageUser('/settings')`.
- Route permission resolves through `ROUTE_PERMISSION_RULES` and requires `settings.manage`.
- Settings APIs use `requireApiPermission(request, 'settings.manage')`.
- Current Settings page has no read-only mode because users without `settings.manage` are redirected before the page renders.
- There is no export/import/backup/restore capability.
- There are two destructive maintenance actions:
  - Reset match history.
  - Delete all player images.
- Current destructive confirmation uses `window.confirm`.
- Sprint 10.10 may improve confirmation presentation but must keep handlers, payloads, API endpoints, permission checks, and destructive semantics unchanged.

## Section / Action Permission Matrix

| Section/Action | View permission | Edit permission | Server guard | UI state | Handler | Risk | Required preservation |
|---|---|---|---|---|---|---|---|
| Settings route | `settings.manage` | N/A | `requirePageUser('/settings')` | Page rendered only for authorized user | N/A | UI must not imply read-only access exists | Route guard unchanged. |
| Branding name/logo | `settings.manage` | `settings.manage` | Branding API uses `requireApiPermission('settings.manage')` | Editable form | `updateName`, `uploadLogo`, `deleteLogo` mutations | Payload or validation drift | Field keys, mutation, API, cache invalidation unchanged. |
| Schedule max courts | `settings.manage` | `settings.manage` route access; local setting write | Client localStorage setting | Editable numeric input | `setSetting('maxCourtCountPerSession', normalizeMaxCourtCount(value))` | Default/normalization drift | Local key, clamp, normalization unchanged. |
| Finance auto vouchers | `settings.manage` | `settings.manage` route access; local setting write | Client localStorage setting | Editable switches | `setSetting(...)` | Finance behavior drift | Boolean keys and defaults unchanged. |
| Appearance theme | `settings.manage` | Existing theme control | Browser localStorage through `ThemeToggle` | Editable theme button | `ThemeToggle` internal handler | Theme persistence drift | Existing key/persistence unchanged. |
| Reset match history | `settings.manage` | `settings.manage` | `DELETE /api/match-history/reset` uses `requireApiPermission('settings.manage')` | Danger action | `resetMatchHistory()` | Destructive action without clear confirmation | Handler, endpoint, payload, confirmation requirement unchanged. |
| Delete player images | `settings.manage` | `settings.manage` | `DELETE /api/settings/player-images` uses `requireApiPermission('settings.manage')` | Danger action | `deleteAllPlayerImages()` | Destructive action without clear confirmation | Handler, endpoint, payload, confirmation requirement unchanged. |
| Export/import/backup/restore | N/A | N/A | None | Missing | None | Fake control could imply data safety feature exists | Do not implement. |

## Current-User / System-Admin Restrictions

- There is no dedicated Settings system-admin role beyond `settings.manage`.
- Unauthorized users are redirected before Settings page render.
- Server authorization remains the security boundary for destructive APIs.
- UI disabled/read-only states must be treated as presentation only.

## Implementation Candidate

- Replace browser-native destructive confirmation presentation with existing `Dialog` primitive.
- Add clearer danger zone copy and permission explanation to existing destructive sections.
- Preserve service functions and payload-free DELETE calls exactly.
