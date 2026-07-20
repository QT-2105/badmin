# Current Audit

The current list is a manual grid with fixed min width and inline inputs/selects.

Risks:

- Migrating to DataTable may accidentally alter inline save-on-blur behavior.
- Row order is locally sorted by `createdAt` descending in the component.
- Pagination is client-side.
