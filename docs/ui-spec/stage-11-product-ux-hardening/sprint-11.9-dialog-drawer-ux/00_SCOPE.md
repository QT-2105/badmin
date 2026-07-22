# Sprint 11.9 — Dialog And Drawer UX Scope

Goal:

- Replace UI-flow `window.confirm` and `window.alert` usage with shared dialog presentation.
- Standardize confirmation UX through a shared `ConfirmationDialog`.
- Harden Dialog and Drawer portal/focus/scroll behavior.

Allowed:

- Shared Dialog/Drawer portal presentation.
- Shared `ConfirmationDialog` with presentation props and callbacks.
- UI state for pending confirmation targets.
- Replacing native confirm calls while preserving existing handlers/mutations/payloads.

Not allowed:

- Changing delete handlers.
- Changing mutations.
- Changing permission checks.
- Changing payloads.
- Changing loading, success, or error behavior beyond dialog presentation.
- Changing runtime sync, queue, pairing, court assignment, or match lifecycle logic.

