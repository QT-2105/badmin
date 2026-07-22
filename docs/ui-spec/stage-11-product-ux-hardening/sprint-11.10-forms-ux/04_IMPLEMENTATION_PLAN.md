# Sprint 11.10 — Forms UX Implementation Plan

## Task 1 — Shared Form Primitive Hardening

- Files: `src/components/ui/form.tsx`, `src/components/ui/page-layout.tsx`.
- Changes:
  - Standardize `focus-visible` states.
  - Add `aria-invalid` presentation hooks.
  - Improve disabled contrast presentation.
  - Improve checkbox/switch touch sizing.
  - Add presentation-only `Radio`.
  - Add `FormMessage` alert semantics.
  - Add `RequiredMark`.
- Logic to preserve: all component props remain backward-compatible and no business, permission, query, mutation, or validation logic is introduced.
- Validation: lint, typecheck, build, DB schema guard.

## Task 2 — Numeric And Currency Helper Presentation

- Files: `src/components/finance/finance-page-client.tsx`.
- Changes:
  - Clarify quantity label.
  - Add unit helper for quantity.
  - Add unit helper for unit price.
  - Preserve number inputs, state setters, amount preview, and submit payload.
- Logic to preserve: `quantity`, `unitPrice`, `total_amount`, finance mutation payload, and existing validation behavior.
- Validation: lint, typecheck, build, DB schema guard.

## Task 3 — Date/Time And Numeric Form Readability

- Files: `src/components/schedule/play-date-detail-client.tsx`.
- Changes:
  - Clarify start/end time labels.
  - Clarify court-count label and helper text.
  - Keep mobile/tablet form layout readable.
- Logic to preserve: create/edit session state, default values, max court count, handlers, validation behavior, mutations, route behavior, and permissions.
- Validation: lint, typecheck, build, DB schema guard.

## Stop Criteria

- Any validation failure.
- Any protected file diff.
- Any need to change schema, payload, submit handler, mutation, validation, route, permission, finance calculation, inventory calculation, or runtime logic.

