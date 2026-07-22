# Sprint 12.4 Scope

## Goal

Balance information density, quick scanning, whitespace, screen size and operation frequency across the product.

## Module Density Decisions

| Module | Density Direction | Decision |
| --- | --- | --- |
| Dashboard | Airier overview | Keep current overview spacing; no source change. |
| Runtime | Higher density | No Runtime file changed; protected workflow and compact runtime layout preserved. |
| Finance | Balanced summary and table density | Compact section surfaces around form and transaction list. |
| Inventory | Dense operational stock and movement review | Compact product, movement and operation sections; remove leftover decorative shadow on filter surface. |
| Users | Search and management focused | Audit only in this sprint; no source change. |
| Settings | Less sparse | Compact settings navigation and remove unnecessary card shadow. |

## Page Hierarchy

Standard presentation order remains:

1. Page header.
2. Context/action toolbar.
3. KPI/summary.
4. Primary content.
5. Secondary content.
6. Feedback states.

Runtime keeps the approved operational order:

1. Next Matches.
2. Courts.
3. Waiting Queue.

## Not In Scope

- Business logic.
- Runtime ordering, queue, pairing, court assignment or match lifecycle.
- Finance formulas or transaction semantics.
- Inventory stock, average cost, movement semantics or conversion.
- Query keys, mutations, payloads, validation, permissions or routes.
