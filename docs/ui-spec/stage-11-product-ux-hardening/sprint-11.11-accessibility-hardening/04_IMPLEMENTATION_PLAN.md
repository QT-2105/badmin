# Sprint 11.11 — Implementation Plan

## Task 1 — App Landmark And Navigation Semantics

- File: `src/components/app-shell.tsx`.
- Change: add skip link, `main-content` target, and explicit desktop nav label.
- Preservation: route links, permission filtering, collapsed-state persistence, logout, theme, fullscreen, and navigation logic unchanged.

## Task 2 — Shared Control Accessibility

- Files: `src/components/ui/theme-toggle.tsx`, `src/components/ui/fullscreen-toggle.tsx`, `src/components/ui/action-menu.tsx`, `src/components/ui/drawer.tsx`, `src/components/ui/data-table.tsx`.
- Changes:
  - Add focus-visible rings and pressed state for theme/fullscreen controls.
  - Add ActionMenu trigger focus return and menu control linkage.
  - Add Drawer fallback accessible name.
  - Add DataTable mobile-card list semantics.
- Preservation: handlers, open/close state, item selection, drawer behavior, table rows, columns, pagination, and data unchanged.

## Task 3 — Product Dialog Semantics

- Files: `src/components/player/player-quick-view.tsx`, `src/components/schedule/session-detail-client.tsx`.
- Changes:
  - Use shared `Dialog` for player quick view.
  - Use shared `Dialog` for session completion confirmation.
  - Replace wrapper `role="button"` player row affordance with a native `button` for quick view.
- Preservation: current player source, quick-view `onClose`, completion confirmation handler, disabled/loading conditions, completion payload, mutation, permission behavior, and route behavior unchanged.

## Task 4 — Validation And Report

- Commands:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run guard:no-db-schema-automation`
  - `git diff --check`
  - protected diff command
- Stop criteria: any validation failure or protected diff.

