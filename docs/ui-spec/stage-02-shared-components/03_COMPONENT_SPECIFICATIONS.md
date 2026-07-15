# Component Specifications

## General Rules

All Stage 02 components must:

- be presentation-first and business-agnostic
- accept caller-provided data, handlers, labels, and renderers
- preserve caller behavior
- support light and dark mode
- use Stage 01 semantic tokens
- expose accessible focus states
- support keyboard navigation when interactive
- avoid domain-specific enum names
- avoid hidden data fetching
- avoid implicit mutations

## DataTable

### Purpose

Render operational data lists consistently across Finance, Inventory, Users, Dashboard, and future management screens.

### Required Capabilities

- column definitions
- row rendering
- optional row actions
- optional pagination slot
- optional loading state
- optional empty state
- optional error state
- horizontal scroll wrapper
- numeric alignment
- action column alignment
- compact and comfortable density

### Non-Goals

Do not add:

- server-side sorting
- server-side filtering
- internal fetch logic
- business-specific filters
- automatic mutation behavior
- spreadsheet-like editing engine

### API Direction

The component should accept:

- `columns`
- `rows`
- `getRowKey`
- `renderCell`
- `actions`
- `loading`
- `error`
- `empty`
- `pagination`
- `density`
- `minWidth`

Column definitions should support:

- `key`
- `header`
- `align`
- `width`
- `hideOnMobile` only if it does not remove required operational data

## FilterBar

### Purpose

Standardize report period filters, sort controls, page-size controls, and lightweight action groups.

### Required Capabilities

- title and description slot
- left content slot
- right actions slot
- compact one-line layout on desktop
- stacked layout on mobile
- consistent input sizing

### Non-Goals

- no query-string management
- no fetch triggering
- no filter persistence
- no domain-specific filter presets

## StatCard

### Purpose

Standardize quick-stat and KPI cards across Dashboard, Finance, Inventory, Runtime summaries, and future screens.

### Required Capabilities

- label
- value
- subtext
- icon
- tone
- optional trend indicator
- compact and default density

### Tone Map

- `neutral`
- `info`
- `success`
- `warning`
- `danger`
- `income`
- `expense`
- `profit`
- `inventory`

### Non-Goals

- no calculations
- no formatting assumptions beyond rendering caller-provided content

## FormSection

### Purpose

Standardize collapsible or grouped form areas such as Settings panels, Finance create form, Inventory create form, and Session detail form groups.

### Required Capabilities

- title
- description
- actions
- collapsible mode
- danger mode
- disabled mode
- footer slot
- responsive grid content

### Non-Goals

- no validation rules
- no submit behavior
- no form library coupling

## ActionMenu

### Purpose

Provide consistent compact action menus for rows/cards where multiple actions do not fit.

### Required Capabilities

- trigger button
- menu items
- disabled items
- danger items
- icons
- keyboard navigation
- escape/outside close

### Non-Goals

- no permission checks inside component
- no business action execution beyond caller handlers

## Dialog

### Purpose

Standardize confirmation and detail overlays.

### Required Capabilities

- controlled open state
- title
- description
- body
- footer actions
- close button
- escape/outside close options
- initial focus and focus return
- responsive max width
- semantic danger/warning support

### Non-Goals

- no form submission logic
- no domain-specific confirmation text
- no automatic mutation

## Drawer

### Purpose

Support mobile/tablet secondary workflows without replacing page layout.

### Required Capabilities

- controlled open state
- side or bottom placement
- title/description/header actions
- body
- footer
- scroll-contained content
- focus management

### Non-Goals

- no route interception
- no runtime workflow redesign
- no mandatory replacement of existing modals

## Feedback States

### Purpose

Standardize loading, empty, error, warning, success, and disabled states.

### Components

- `LoadingState`
- `EmptyState`
- `ErrorState`
- `WarningState`
- `SuccessState`
- `DisabledState`

### Required Capabilities

- icon
- title
- description
- action slot
- compact/default size
- table/list-compatible rendering

### Non-Goals

- no automatic retry
- no logging
- no toast system in Stage 02

