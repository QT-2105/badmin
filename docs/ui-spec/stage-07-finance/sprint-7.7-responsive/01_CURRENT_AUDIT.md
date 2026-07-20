# Current Audit

Status: Complete

Finance already has responsive grids and internal list overflow. Sprint 7.7 focused on avoiding cramped tablet layouts and keeping controls reachable without changing workflow.

## Viewport Review

- `1440x900`: KPI cards can use three columns; table keeps internal horizontal scroll.
- `1280x800`: KPI cards can use three columns; create form can use the dense desktop grid.
- `1366x1024`: desktop/tablet landscape density remains usable.
- `1180x820`: form should avoid the six-column layout because app shell/sidebar width can make fields too narrow.
- `1024x1366`: tablet portrait should use two-column form layout and wrapped filters.
- `820x1180`: controls must stack/wrap without page-level overflow.
- `390x844`: mobile smoke should keep fields and buttons full-width, with table overflow isolated inside `DataTable`.

## Findings

- KPI grid used `xl:grid-cols-3`, leaving laptop/tablet landscape with a less efficient two-column layout.
- Form used the six-column layout at `lg`, which can be too dense on tablet landscape/portrait when app shell width is constrained.
- Filter and list controls needed explicit mobile widths to avoid awkward shrink/wrap behavior.
- Table already uses bounded `DataTable` overflow; no data or table structure changes were needed.

## Protected Areas

No finance hooks, services, repositories, API, calculations, Prisma, permissions, route behavior, fields, handlers, filters, or workflow should be changed for this sprint.
