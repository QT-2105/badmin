# Stage 02 Scope

## Goal

Create a reusable shared component library so future screens can be built by composing stable primitives instead of copy-pasting local UI implementations.

The goal is visual and interaction consistency, not new business behavior.

## In Scope

### Shared Components

Stage 02 may introduce or refine these shared components:

- `DataTable`
- `FilterBar`
- `StatCard`
- `FormSection`
- `ActionMenu`
- `Dialog`
- `Drawer`
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `ConfirmState`
- shared list/table pagination surface
- shared section action layout

### Shared Behavior Allowed

Allowed behavior must be generic presentation behavior only:

- open/close local dialog state inside shared UI when caller controls it
- keyboard focus management for dialogs/drawers/menus
- escape-to-close for modal primitives
- outside-click close for modal/menu primitives when safe
- aria labels and roles
- responsive layout wrappers
- loading/empty/error display states

### Shared Styling

Allowed:

- semantic tokens
- typography utilities
- spacing and density scale
- border/radius/shadow scale
- light/dark parity
- accessible focus states
- disabled states
- hover/pressed states

## Out Of Scope

Do not implement:

- new data fetching
- new API endpoints
- table server-side sorting
- table server-side filtering
- table server-side pagination
- export/import features
- settings-driven component customization
- runtime scheduling redesign
- finance calculation changes
- inventory calculation changes
- auth/permission changes
- route changes
- Prisma/database changes

## Protected Areas

Do not modify without explicit owner approval:

- `src/lib/badminton-store.ts`
- `src/components/realtime-dashboard.tsx`
- `src/components/sections/live-courts-section.tsx`
- `src/components/sections/next-match-queue.tsx`
- `src/components/sections/player-database-panel.tsx`
- `src/components/cards/court-card.tsx`
- `src/components/cards/next-match-card.tsx`
- runtime hydration/sync hooks
- runtime repositories
- `/api/runtime/snapshot`

Runtime can consume shared components later only through an owner-approved runtime UI task.

## Success Definition

Stage 02 is successful when:

- shared components exist with stable, generic APIs
- components are style-token compliant
- components do not know domain business logic
- screens can migrate gradually
- existing screens keep current behavior
- validation passes
- protected runtime and backend files remain unchanged

