# Sprint 11.12 — Implementation Plan

## Task 1 — Motion Utilities

- File: `src/app/globals.css`.
- Add lightweight motion utilities for feedback, overlay, dialog, and drawer entry.
- Support `prefers-reduced-motion` explicitly.
- Preserve existing CSS tokens and business timing.

## Task 2 — Shared Feedback States

- File: `src/components/ui/feedback.tsx`.
- Add reduced-motion support to `Skeleton` and `LoadingState`.
- Apply consistent entry motion to feedback states.
- Preserve props and behavior.

## Task 3 — Shared Interaction States

- Files: `src/components/ui/button.tsx`, `src/components/ui/surface.tsx`, `src/components/ui/status-badge.tsx`, `src/components/ui/stat-card.tsx`.
- Standardize hover/pressed/focus transition scopes.
- Preserve handlers, disabled behavior, and default variants.

## Task 4 — Overlay And Menu Motion

- Files: `src/components/ui/dialog.tsx`, `src/components/ui/drawer.tsx`, `src/components/ui/action-menu.tsx`.
- Apply lightweight entry motion.
- Preserve portal, focus trap, Escape behavior, outside click behavior, focus return, and callback props.

## Task 5 — Validation

- Commands:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run guard:no-db-schema-automation`
  - `git diff --check`
  - protected diff command

## Stop Criteria

- Any validation failure.
- Any protected diff.
- Any need to change runtime timing, countdowns, match timers, refresh intervals, retry intervals, handlers, payloads, routes, permissions, or business logic.

