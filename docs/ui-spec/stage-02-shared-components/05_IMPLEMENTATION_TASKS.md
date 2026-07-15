# Stage 02 Implementation Tasks

## Task 0 - Preflight

Before coding:

- read Stage 01 and Stage 01.5 docs
- run `git status --short`
- identify unrelated dirty files
- confirm protected-area diff is empty for backend/runtime
- list intended files to edit

No source code changes during Task 0.

## Task 1 - Component API Plan

Write the exact TypeScript props for:

- `DataTable`
- `FilterBar`
- `StatCard`
- `FormSection`
- `ActionMenu`
- `Dialog`
- `Drawer`
- feedback states

Do not implement until the API plan is internally consistent and business-agnostic.

## Task 2 - Feedback States

Implement or extend:

- `LoadingState`
- `EmptyState`
- `ErrorState`
- `WarningState`
- `SuccessState`
- `DisabledState`

Validation:

- `npm run lint`
- `npm run typecheck`

## Task 3 - FormSection

Create `FormSection` using existing `Surface`, `Button`, and typography tokens.

Requirements:

- optional collapse
- optional danger tone
- action slot
- footer slot
- no validation logic

Validation:

- `npm run lint`
- `npm run typecheck`

## Task 4 - FilterBar

Create `FilterBar` for compact report/filter controls.

Requirements:

- one-line desktop layout
- stacked mobile layout
- title/description
- actions slot

Validation:

- `npm run lint`
- `npm run typecheck`

## Task 5 - StatCard

Create `StatCard` or formalize `MetricCard` compatibility.

Requirements:

- semantic tone map
- label/value/sub/icon
- compact/default density
- no calculation logic

Validation:

- `npm run lint`
- `npm run typecheck`

## Task 6 - DataTable

Create `DataTable` as a rendering primitive.

Requirements:

- columns
- rows
- cell renderers
- horizontal scroll support
- loading/empty/error slots
- pagination slot
- row action slot
- alignment support

Forbidden:

- internal fetch
- internal mutations
- server-side sorting/filtering
- changing table data shape

Validation:

- `npm run lint`
- `npm run typecheck`

## Task 7 - Dialog

Create controlled `Dialog`.

Requirements:

- accessible role/labels
- focus management
- escape close
- outside close option
- footer actions
- danger/warning tone support

Validation:

- `npm run lint`
- `npm run typecheck`

## Task 8 - Drawer

Create controlled `Drawer`.

Requirements:

- side/bottom placement
- scroll-contained body
- focus management
- responsive behavior

Validation:

- `npm run lint`
- `npm run typecheck`

## Task 9 - ActionMenu

Create `ActionMenu`.

Requirements:

- trigger
- item list
- disabled/danger items
- keyboard navigation
- outside/escape close

Validation:

- `npm run lint`
- `npm run typecheck`

## Task 10 - Safe Adoption Pilot

Pick one low-risk screen area for pilot adoption.

Preferred order:

1. Dashboard recent sessions readonly table
2. Finance transaction list shell
3. Inventory movement list shell

Rules:

- preserve columns
- preserve row actions
- preserve handlers
- preserve data mapping

Validation:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run guard:no-db-schema-automation`

## Task 11 - Completion Report

Report:

- files changed
- components added
- screens migrated
- protected files unchanged
- business logic unchanged
- validation output
- deferred issues
- final decision

