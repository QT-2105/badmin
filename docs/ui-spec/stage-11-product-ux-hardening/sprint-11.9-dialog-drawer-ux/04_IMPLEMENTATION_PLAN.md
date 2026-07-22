# Sprint 11.9 Implementation Plan

1. Add portal rendering to shared `Dialog` and `Drawer`.
2. Add optional `closeDisabled` to prevent close while a confirmation mutation is loading.
3. Add shared `ConfirmationDialog` with props:
   - `open`
   - `title`
   - `description`
   - `confirmLabel`
   - `cancelLabel`
   - `tone`
   - `isLoading`
   - `onConfirm`
   - `onCancel`
4. Replace native confirm in Schedule delete play date flow.
5. Replace native confirm in Play Date Detail delete session flow.
6. Replace native confirm in Inventory delete product flow.
7. Replace runtime unsynced leave confirm with route-pending confirmation dialog.
8. Run static search to confirm no `window.confirm` or `window.alert` remains.
9. Run validation and protected diff.

## Handler Preservation

| Flow | Existing handler/mutation | Preservation |
| --- | --- | --- |
| Delete play date | `deletePlayDate.mutateAsync(id)` | Same id passed from pending state. |
| Delete session | `deletePlaySession.mutateAsync(session.id)` | Same session id passed from pending state. |
| Delete inventory product | `deleteProduct.mutateAsync(product.id)` | Same product id passed from pending state. |
| Runtime leave | Link to Dashboard/session detail | Same clicked route stored and pushed after confirmation. |

## Validation

- `rg "window\\.(confirm|alert)|confirm\\(|alert\\(" src -n`
- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run guard:no-db-schema-automation`

