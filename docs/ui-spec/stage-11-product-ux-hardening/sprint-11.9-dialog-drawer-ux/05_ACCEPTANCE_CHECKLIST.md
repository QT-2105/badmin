# Sprint 11.9 Acceptance Checklist

- [x] All UI-flow `window.confirm` calls were replaced.
- [x] No `window.alert` call exists in `src`.
- [x] Shared `ConfirmationDialog` contains no delete/business logic.
- [x] Delete play date handler and mutation are preserved.
- [x] Delete session handler and mutation are preserved.
- [x] Delete inventory product handler and mutation are preserved.
- [x] Runtime unsynced leave guard still blocks navigation until explicit confirmation.
- [x] Dialog uses portal rendering.
- [x] Drawer uses portal rendering.
- [x] Dialog has accessible title, description, aria-modal, focus trap, Escape handling, focus return, body scroll lock, overlay, and accessible close button.
- [x] Confirmation close is disabled while loading.
- [x] Protected file diff is clean.
- [x] `npm run lint` passed.
- [x] `npm run typecheck` passed.
- [x] `npm run build` passed.
- [x] `npm run guard:no-db-schema-automation` passed.

