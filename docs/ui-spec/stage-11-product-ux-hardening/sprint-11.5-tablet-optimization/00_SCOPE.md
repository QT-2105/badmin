# Sprint 11.5 — Tablet Optimization Scope

## Objective

Optimize tablet presentation for priority viewports:

- 1180x820
- 1280x800
- 1366x1024
- 1024x1366
- 820x1180

## Modules Audited

- App Shell
- Dashboard
- Schedule
- Session Workspace
- Runtime
- Finance
- Inventory
- Users
- Settings

## Allowed Changes

- Grid columns.
- Card sizing.
- Text wrapping.
- Button size.
- Gap.
- Scroll container.
- Sticky behavior only when workflow is unchanged.
- Responsive class changes.

## Runtime Safety Lock

Runtime presentation may be adjusted only if the following remain unchanged:

- Queue ordering.
- Pairing.
- Court assignment.
- Match lifecycle.
- Zustand state.
- Apply handler.
- Start/end handler.

## Explicitly Out Of Scope

- Business logic.
- API, database, Prisma, repository, service, hook, store, query, mutation, payload, validation, permission, or route changes.
- Runtime algorithm changes.
- Finance or inventory calculation changes.
