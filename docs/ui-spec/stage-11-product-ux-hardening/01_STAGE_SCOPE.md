# Stage 11 Scope

## In Scope

- App Shell responsive and navigation presentation.
- Dashboard responsive/card/table/chart presentation.
- Schedule and play-date detail responsive/form/card presentation.
- Session Workspace responsive/form/player-list presentation.
- Runtime presentation hardening only, with protected runtime behavior unchanged.
- Finance responsive/form/table/feedback presentation.
- Inventory responsive/form/table/feedback presentation.
- Users and permissions responsive/table/form/matrix presentation.
- Settings responsive/form/confirmation presentation.
- Shared components: Button, Badge, Dialog, Drawer, DataTable, FilterBar, FormSection, StatCard, EmptyState, LoadingState and Pagination.

## Out of Scope

- New features.
- New routes.
- New settings.
- New filters or sorting.
- Data model changes.
- Any runtime lifecycle, scheduling, finance, inventory, auth or permission logic change.

## Stop Conditions

Stop the active sprint if a presentation improvement requires:

- changing handler arguments
- changing data mapping
- changing query keys
- changing mutation payload
- changing validation rules
- changing protected runtime actions
- changing finance or inventory calculation helpers
- changing route or permission behavior

