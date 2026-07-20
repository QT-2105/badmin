# Security and Destructive Actions Implementation Plan

Status: NOT STARTED / LIMITED

## Capability Result

- Settings permissions are `AVAILABLE` as route/API guards using `settings.manage`.
- Security settings are `MISSING` and must not be implemented.
- Export/import/backup/restore actions are `MISSING` and must not be implemented.
- Destructive maintenance actions are `AVAILABLE` only for existing reset history and delete player images flows.

## Action Preservation Table

| Section/Action | View permission | Edit permission | Server guard | UI state | Handler | Risk | Required preservation |
|---|---|---|---|---|---|---|---|
| Settings page | `settings.manage` | N/A | `requirePageUser('/settings')` | Authorized page only | N/A | Privilege exposure | Do not change route guard. |
| Branding | `settings.manage` | `settings.manage` | Branding APIs | Editable | Branding mutations | Payload drift | Do not modify in Sprint 10.10. |
| Schedule / Finance / Appearance | `settings.manage` | `settings.manage` route access | Local preference / existing components | Editable | Existing setters/components | Config drift | Do not modify business keys or defaults. |
| Reset match history | `settings.manage` | `settings.manage` | `DELETE /api/match-history/reset` | Danger action with confirmation | `resetMatchHistory()` | Destructive accidental action | Keep handler, endpoint, payload, confirmation requirement. |
| Delete player images | `settings.manage` | `settings.manage` | `DELETE /api/settings/player-images` | Danger action with confirmation | `deleteAllPlayerImages()` | Destructive accidental action | Keep handler, endpoint, payload, confirmation requirement. |
| Export/import/backup/restore | N/A | N/A | None | Missing | None | Fake data safety controls | Do not implement. |

## Source Implementation Plan

Allowed source file:

- `src/components/settings/settings-page-client.tsx`

Presentation-only changes:

1. Import existing `Dialog` primitive.
2. Add local presentation state for the pending destructive confirmation action.
3. Replace `window.confirm` presentation with a controlled danger `Dialog`.
4. Keep `resetMatchHistory()` and `deleteAllPlayerImages()` service calls unchanged.
5. Keep DELETE payloads empty and API endpoints unchanged.
6. Add concise permission/danger explanation to destructive sections.
7. Preserve disabled/loading conditions for destructive action buttons.

## Explicit Non-Changes

- No permission key changes.
- No route guard changes.
- No API guard changes.
- No handler payload changes.
- No endpoint changes.
- No new security settings.
- No re-authentication or password confirmation.
- No export/import/backup/restore UI.
- No destructive semantics changes.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build` at checkpoint or when source changes
- `npm run guard:no-db-schema-automation` at checkpoint or completion
