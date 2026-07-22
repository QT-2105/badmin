# Cross-Module Consistency Report

## Consistent Patterns Already Established

- Page-level layout and header primitives are widely adopted.
- KPI/stat cards are tokenized and used consistently in core modules.
- Shared `Button`, `Dialog`, `Drawer`, `DataTable`, `StatusBadge`, `FilterBar`, `FormSection`, feedback states and pagination exist.
- Expand/collapse labels generally use `Mở rộng` / `Thu gọn`.
- Light/dark tokens are established.

## Inconsistency Targets

| Pattern | Modules | Risk |
| --- | --- | --- |
| Native confirm vs shared Dialog | Schedule, Inventory, Runtime | Inconsistent confirmation UX; runtime leave guard is protected. |
| Large single-file presentation components | Inventory, Session, Settings, Runtime, Users, Finance | Maintenance risk and harder consistent responsive fixes. |
| Wide table scroll styling | Users, Inventory, Runtime player panel, Finance | Scroll affordance and keyboard access vary. |
| Loading/empty/error presentation | Dashboard, Schedule, Finance, Inventory, Users | Some module-specific placeholders remain. |
| Touch target density | Runtime, Users, Inventory, Session player rows | Needs device verification. |
| Overlay implementations | Shared Dialog/Drawer, Player Quick View, Runtime panels, Match History | Focus/stacking/scroll behavior varies. |

## Implementation Direction

- Prefer shared primitives where behavior is already compatible.
- Do not force migration when inline workflow would require handler or state changes.
- Decompose large components only into local presentation components first.
- Keep module-specific business data mapping in callers.

