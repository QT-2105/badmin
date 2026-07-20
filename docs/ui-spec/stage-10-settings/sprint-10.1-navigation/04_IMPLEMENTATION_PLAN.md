# Settings Navigation Implementation Plan

Status: IMPLEMENTED

## Scope

Sprint 10.1 is limited to Settings information architecture and in-page navigation for capabilities that already exist in the Settings page. It does not create new settings, routes, permissions, APIs, config storage, or handlers.

## Navigation Decision Table

| Navigation item | Capability status | Existing route | Permission | Visible condition | Implementation decision |
|---|---|---|---|---|---|
| Thông tin CLB | AVAILABLE | `/settings` | Existing Settings page access | Settings page renders branding controls | Add in-page navigation item and scroll target. |
| Lịch & ca chơi | PARTIAL | `/settings` | Existing Settings page access | `maxCourtCountPerSession` setting exists | Add in-page navigation item and scroll target. |
| Thu chi | PARTIAL | `/settings` | Existing Settings page access | Auto-transaction toggles exist | Add in-page navigation item and scroll target. |
| Ảnh người chơi | AVAILABLE | `/settings` | Existing Settings page access | Existing image cleanup action exists | Add in-page navigation item and scroll target. |
| Lịch sử trận | AVAILABLE | `/settings` | Existing Settings page access | Existing reset match history action exists | Add in-page navigation item and scroll target. |
| Appearance | PARTIAL | No dedicated Settings section | Existing global theme control outside Settings | No real Settings section content | Do not add navigation item. |
| Notifications | MISSING | None | None | No capability | Do not add navigation item. |
| Backup/Restore | MISSING | None | None | No capability | Do not add navigation item. |
| Security | MISSING | None | None | No capability | Do not add navigation item. |

## Allowed Files

- `src/components/settings/settings-page-client.tsx`
- `docs/ui-spec/stage-10-settings/**`

## Protected Files

- API routes.
- Repositories.
- Services.
- Prisma/database files.
- Auth/session/permission code.
- Runtime, finance, and inventory logic.
- Settings hooks and storage logic.

## Preserved Behavior

- Route remains `/settings`.
- No route parameters or query parameters were introduced.
- Existing permission and page access behavior remains unchanged.
- Existing handlers for branding, app settings, reset history, and image cleanup remain unchanged.
- Existing payloads, validation, defaults, and storage behavior remain unchanged.
- Browser back/forward behavior is unchanged because the navigation does not mutate URL state.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
