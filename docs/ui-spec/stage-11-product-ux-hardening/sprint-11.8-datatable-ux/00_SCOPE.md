# Sprint 11.8 — DataTable UX Scope

Goal:

- Improve DataTable presentation across desktop, tablet, and mobile.
- Keep table behavior owned by callers.
- Add optional presentation props only when needed.

Allowed:

- DataTable responsive presentation props.
- DataTable local overflow and sticky header presentation.
- Mobile card renderer controlled by caller.
- Captions and row labels for accessibility.
- Presentation-only adoption in current DataTable consumers.

Not allowed:

- Changing data source.
- Changing sorting.
- Changing filtering.
- Changing pagination.
- Changing row IDs.
- Changing selection semantics.
- Changing query params.
- Changing routes.
- Changing handlers.
- Changing permissions.
- Moving module logic into DataTable.

