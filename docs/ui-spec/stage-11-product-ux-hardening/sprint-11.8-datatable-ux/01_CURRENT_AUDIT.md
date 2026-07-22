# Sprint 11.8 Current Audit

## Direct DataTable Consumers

| Module | Current table | Desktop mode | Tablet mode | Mobile mode before Sprint | Risk |
| --- | --- | --- | --- | --- | --- |
| Dashboard | Recent sessions | Wide DataTable with horizontal overflow | Scroll table | Scroll table | Dense financial/session columns are hard to scan on mobile. |
| Finance | Transaction entries | DataTable with sort/page controls outside table | Scroll table | Scroll table | Amount, content, and timestamp require horizontal scan on mobile. |
| Inventory | Product list | DataTable with action callback | Scroll table | Scroll table | Product stock/cost columns exceed mobile width. |
| Inventory | Movement history | Paginated DataTable | Scroll table | Scroll table | Movement type, quantity, money, and timestamp are hard to compare on mobile. |

## Related Non-DataTable Tables / Lists

| Module | Current implementation | Classification | Sprint decision |
| --- | --- | --- | --- |
| Users | Custom ARIA table/grid with inline editable fields | KEEP CUSTOM TABLE | Not migrated because inline save-on-blur controls and permission-sensitive fields are tightly coupled to the current layout. |
| Schedule sessions | Card/list layout | NOT APPLICABLE | Already card-based; no DataTable adoption needed. |
| Permission matrix | Checkbox card grid grouped by permission module | KEEP MATRIX GRID | Not migrated because matrix semantics are not tabular row data and assignment handlers must remain untouched. |

## DataTable Primitive Gaps

- No responsive mode to allow a consumer-owned mobile card renderer.
- No sticky header option.
- Caption exists from Sprint 11.7 but consumers did not consistently use it.
- Row-level accessible label needed for mobile cards.

