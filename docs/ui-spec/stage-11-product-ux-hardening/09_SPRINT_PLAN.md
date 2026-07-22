# Stage 11 Sprint Plan

## Sprint 11.0 — Audit Baseline

- Type: documentation only.
- Output: UX audit, responsive baseline, accessibility baseline, protected map, risk map.
- Validation: no source validation required unless docs lint exists.

## Sprint 11.1 — App Shell And Global Layout

- Scope: app shell, page-level overflow, global navigation presentation.
- No route/nav item changes.
- Validation: lint, typecheck, build.

## Sprint 11.2 — Shared Component Consistency

- Scope: shared Button, Badge, Dialog, Drawer, DataTable, Feedback, FormSection, Pagination, Surface.
- Only backward-compatible presentation props.
- Validation: lint, typecheck, build.

## Sprint 11.3 — Dashboard And Schedule Hardening

- Scope: Dashboard, Schedule, Play Date Detail.
- Address `window.confirm` candidates only with approved Dialog preservation.
- Validation: lint, typecheck, build, DB guard.

## Sprint 11.4 — Session Workspace And Runtime Hardening

- Scope: Session Workspace and Runtime presentation only.
- Highest protection. No runtime lifecycle or handler changes.
- Validation: lint, typecheck, build, DB guard, protected diff.

## Sprint 11.5 — Finance And Inventory Hardening

- Scope: finance/inventory forms, tables, overflow, confirmations, feedback.
- No calculation/payload/stock/transaction changes.
- Validation: lint, typecheck, build, DB guard.

## Sprint 11.6 — Users And Settings Hardening

- Scope: user/settings forms, tables, permission matrix, settings confirmations.
- No auth/permission/settings persistence changes.
- Validation: lint, typecheck, build, DB guard.

## Sprint 11.7 — Dialog, Drawer And Confirmation UX

- Scope: overlay stacking, scroll, focus return, accessible labeling, destructive confirmation presentation.
- No handler semantics changes.
- Validation: lint, typecheck, build.

## Sprint 11.8 — Form And Feedback UX

- Scope: labels, helper text, error/success/loading presentation, disabled states.
- No validation or submit payload changes.
- Validation: lint, typecheck, build.

## Sprint 11.9 — DataTable And Overflow UX

- Scope: table overflow, sticky header options, skeleton rows, numeric alignment, scroll affordance.
- No sorting/filtering/data transformations.
- Validation: lint, typecheck, build.

## Sprint 11.10 — Accessibility And Keyboard Pass

- Scope: ARIA, keyboard, focus-visible, reduced motion, status semantics.
- No authorization or visibility logic changes.
- Validation: lint, typecheck, build, DB guard.

## Sprint 11.11 — Responsive Device QA

- Scope: docs and approved presentation fixes based on viewport QA.
- Viewports: 1440x900, 1280x800, 1366x1024, 1180x820, 1024x1366, 820x1180, 390x844.
- Validation: lint, typecheck, build, DB guard.

## Sprint 11.12 — Completion

- Type: documentation only.
- Output: Stage 11 completion report and project progress update.
- No source changes.

