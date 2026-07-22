# Sprint 11.9 Current Audit

## Native Confirm / Alert Search

Initial source search found:

- `src/components/schedule/schedule-page-client.tsx`: delete play date confirm.
- `src/components/schedule/play-date-detail-client.tsx`: delete session confirm.
- `src/components/inventory/inventory-page-client.tsx`: delete inventory product confirm.
- `src/components/realtime-dashboard.tsx`: runtime unsynced leave guard confirm.

No `window.alert` call was found.

## Regression Targets

| Flow | Existing protected behavior | Sprint replacement |
| --- | --- | --- |
| Delete play date | `deletePlayDate.mutateAsync(id)` with existing permission/action visibility. | Pending play-date id + `ConfirmationDialog` confirm callback calls same mutation. |
| Delete session | `deletePlaySession.mutateAsync(session.id)` with existing permission/action visibility. | Pending session + `ConfirmationDialog` confirm callback calls same mutation. |
| Delete inventory product | `deleteProduct.mutateAsync(product.id)` with existing permission/action visibility. | Pending product + `ConfirmationDialog` confirm callback calls same mutation. |
| Runtime unsynced leave guard | Prevent navigation when sync state is `pending`, `syncing`, or `error` unless user confirms. | Prevent Link default and open `ConfirmationDialog`; confirm pushes the exact pending route. |

## Dialog / Drawer Audit

- `Dialog` already had accessible title, optional description, focus trap, Escape handling, outside-click handling, focus return, close button accessible name, body scroll lock, and viewport bounds.
- `Drawer` already had accessible title/description wiring, focus trap, Escape handling, outside-click handling, focus return, close button accessible name, body scroll lock, and viewport bounds.
- Sprint 11.9 adds portal rendering and optional `closeDisabled` for mutation-safe confirmation flows.

