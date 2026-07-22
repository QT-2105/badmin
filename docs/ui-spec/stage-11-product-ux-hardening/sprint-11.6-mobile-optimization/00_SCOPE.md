# Sprint 11.6 — Mobile Optimization Scope

## Objective

Optimize presentation for mobile viewports:

- 390x844
- 414x896
- 430x932

## Priority Modules

- Dashboard
- Schedule
- Finance
- Inventory
- Users
- Settings

Runtime receives smoke-level review only because the product runtime target remains tablet-first.

## Allowed Changes

- Stack layout.
- Toolbar wrapping.
- Filter collapse through existing responsive wrapping.
- Card view for lists only when semantics are preserved.
- Bottom/full-width action area if workflow is unchanged.
- Full-width mobile dialogs through existing shared primitives.
- Mobile drawer/navigation presentation through existing shell primitives.

## Not Allowed

- Hide important data.
- Change sort/filter behavior.
- Change pagination.
- Change action behavior.
- Change permission behavior.
- Change payloads.
- Change API, database, Prisma, repositories, services, hooks, stores, routes, or validation.
