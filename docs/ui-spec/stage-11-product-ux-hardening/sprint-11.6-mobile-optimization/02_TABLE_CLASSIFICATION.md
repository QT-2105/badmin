# Sprint 11.6 — Table Classification

| Area | Table/List | Decision | Reason |
| --- | --- | --- | --- |
| Dashboard | Recent sessions | RESPONSIVE TABLE | Uses `DataTable`; status, time, money, and link columns should remain explicit with local scroll. |
| Dashboard | Chart | NOT APPLICABLE | Chart uses local horizontal scroll, not table semantics. |
| Schedule | Play date list | MOBILE CARD VIEW | Already card-based; preserves day/session semantics and actions. |
| Schedule | Session list inside day card | MOBILE CARD VIEW | Already link rows/cards; preserves session status and route. |
| Finance | Transaction list | RESPONSIVE TABLE | Financial columns need headers, numeric alignment, and existing pagination/order. |
| Inventory | Product catalog | RESPONSIVE TABLE | Stock, cost, price, and action columns need explicit headers. |
| Inventory | Movement history | RESPONSIVE TABLE | Movement order, type, quantity, price, amount, and timestamp need explicit headers. |
| Users | User management list | RESPONSIVE TABLE | Inline edit fields, role/status controls, and password action need explicit columns. |
| Settings | Settings sections | NOT APPLICABLE | Settings are forms/cards, not tables. |
| Runtime | Court/queue/match areas | NOT APPLICABLE | Runtime uses operational cards/queues and is tablet-first. |

## Decision Notes

- No generic mobile card table view was created because it could remove column semantics, numeric alignment, action association, or inline edit clarity.
- All table areas keep local overflow containers instead of page-level horizontal scroll.
- No sort, filter, pagination, action, permission, or payload behavior changed.
