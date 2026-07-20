# Stage 10 Scope

## Allowed

- Improve settings UI hierarchy, spacing, typography, grouping, labels, helper text, validation presentation, confirmation presentation, success/error feedback, empty/loading states, responsive behavior, light/dark parity, and accessibility.
- Use existing shared primitives such as `PageShell`, `PageHeader`, `Button`, `Input`, `Switch`, `Surface`, `StatusBadge`, `Dialog`, `Drawer`, `EmptyState`, `LoadingState`, and `Skeleton`.
- Improve only capabilities marked `AVAILABLE` or `PARTIAL`.
- Present `READ_ONLY` capability information without editable controls.
- Document `MISSING` capabilities as future scope only.

## Forbidden

- No new settings backend.
- No new config API.
- No database or Prisma change.
- No repository or service creation for new settings.
- No conversion of hard-coded business values into settings.
- No fake UI for missing capabilities.
- No save button for capabilities without an existing save handler.
- No reset-to-default control for capabilities without an existing reset handler.
- No UI-only security control.
- No business calculation inside shared settings components.
- No route, permission, query key, mutation, payload, validation, runtime, finance, or inventory behavior changes.

## Protected Philosophy

Settings remains a small operational preferences surface. It must not become an ERP administration console or global system-control center.
