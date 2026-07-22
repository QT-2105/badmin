# Sprint 11.7 — Shared Components Hardening Scope

Allowed focus:

- Button and IconButton presentation.
- StatusBadge readable semantic presentation.
- Surface/Card containment, spacing, focus, radius, border, and shadow.
- Dialog and Drawer close-button presentation, viewport containment, and focus safety already present.
- DataTable overflow, caption, loading/empty/error presentation.
- FilterBar, FormSection, Skeleton, EmptyState, ErrorState, LoadingState, SuccessState.
- KPI/StatCard accessibility and density presentation.
- Consumer audit for existing shared component usage.

Not allowed:

- Changing existing handler signatures or arguments.
- Changing business logic, permission logic, query/mutation logic, or validation.
- Changing default behavior of existing shared component props.
- Moving domain calculations into shared components.
- Changing status values, role values, transaction values, inventory values, or runtime states.

Backward compatibility requirements:

- All new APIs must be optional props.
- Existing defaults must render the same intent as before.
- Shared components must remain rendering primitives.
- Shared components must not own business decisions.
