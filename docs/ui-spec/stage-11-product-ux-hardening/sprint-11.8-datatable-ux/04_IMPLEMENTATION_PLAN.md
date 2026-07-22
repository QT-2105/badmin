# Sprint 11.8 Implementation Plan

## DataTable Primitive

1. Add optional `responsiveMode`.
2. Add optional `mobileRenderer`.
3. Add optional `rowLabel`.
4. Add optional `stickyHeader`.
5. Keep existing scroll table as default behavior.

## Consumer Adoption

| Table | Desktop mode | Tablet mode | Mobile mode | Essential columns | Optional columns | Action placement |
| --- | --- | --- | --- | --- | --- | --- |
| Dashboard recent sessions | DataTable | DataTable scroll | Mobile card | Session, status, players, courts, paid, profit, court/shuttle cost | Total expense and shuttle pieces can remain in desktop table | Existing detail link remains in row/card. |
| Finance entries | DataTable | DataTable scroll | Mobile card | Type, content, amount, unit price, time | None removed from table | No row action currently exists. |
| Inventory products | DataTable | DataTable scroll | Mobile card | Product, status, tube quantity, stock, avg cost, stock value, sale total | Avg usage remains visible in card/table | Existing edit/delete actions remain DataTable `actions`. |
| Inventory movements | DataTable | DataTable scroll | Mobile card | Movement type, product/content, quantity, unit cost, usage price, total, time | None removed from table | No row action currently exists. |
| Users | Custom ARIA table | Custom scroll table | Custom scroll table | Account, display name, role, status, password action | Activity metadata | Existing inline action remains. |
| Schedule sessions | Card list | Card list | Card list | Session, time, courts, status, actions | None | Existing buttons unchanged. |
| Permission matrix | Card grid | Card grid | Card grid | Permission label, checked state, disabled state | Count metadata | Existing checkbox handlers unchanged. |

## Regression Preservation

- Finance `sortedTransactions`, `visibleTransactions`, `sortBy`, `pageSize`, and `PaginationControls` remain unchanged.
- Inventory `sortedMovements`, `visibleMovements`, `movementPageSize`, and `PaginationControls` remain unchanged.
- Dashboard recent sessions continue to use `data.recentSessions`.
- Product rows continue to use `products` and existing action callback.
- No table receives new sorting/filtering/selection behavior.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run guard:no-db-schema-automation`

