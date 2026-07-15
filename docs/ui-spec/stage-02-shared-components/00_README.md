# Stage 02 - Shared Components

## Purpose

Stage 02 builds the reusable component layer that later screen work can assemble without re-inventing tables, filters, forms, dialogs, action menus, stats, or feedback states.

Stage 02 is not a redesign stage. It must not deeply redesign Dashboard, Runtime, Finance, Inventory, Schedule, Users, or Settings. It prepares shared building blocks and a safe migration path.

## Required Reading Order

Read these files before doing Stage 02 work:

1. `00_README.md`
2. `01_SCOPE.md`
3. `02_COMPONENT_INVENTORY.md`
4. `03_COMPONENT_SPECIFICATIONS.md`
5. `04_MIGRATION_MAP.md`
6. `05_IMPLEMENTATION_TASKS.md`
7. `06_ACCEPTANCE_CHECKLIST.md`

Also read:

- `docs/ui-spec/stage-01-foundation/*`
- `docs/ui-spec/stage-01.5-visual-consistency/*`
- `AGENTS.md`
- `/docs/*`
- `/rules/*`

## Stage Status

Stage 01.5 final state: `PASS WITH NOTES`.

Stage 02 starts after Stage 01.5 acceptance.

## Non-Negotiable Rule

Stage 02 is component-library work only.

Do not change:

- business logic
- API routes
- Prisma models
- database schema
- repositories
- services
- business hooks
- Zustand runtime state logic
- permissions
- route names
- runtime scheduling semantics
- finance calculations
- inventory calculations
- form payload meaning
- table data grouping

## Stage Output

Stage 02 must produce reusable shared components and migration guidance.

The first step is documentation only:

- scope
- component inventory
- component specifications
- migration map
- implementation tasks
- acceptance checklist

No source code should be changed until this stage plan is reviewed.

## Primary Components

Stage 02 focuses on:

- `DataTable`
- `FilterBar`
- `StatCard`
- `FormSection`
- `ActionMenu`
- `Dialog`
- `Drawer`
- feedback states: loading, empty, error, success, warning, disabled

## Final Decision Options

Stage 02 completion must end with one of:

- `PASS`
- `PASS WITH NOTES`
- `BLOCKED`

