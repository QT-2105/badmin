# Sprint 11.4 Current Audit

## Shared Primitive Findings

- `PageShell` already provides page-level width containment and responsive horizontal padding.
- `PageHeader` switches to horizontal layout at `lg`, which can be early for tablet landscape when actions are dense.
- `FilterBar` also switches to horizontal layout at `lg`, which can squeeze filters on 1024px tablet layouts.
- `SectionCard`, `ToolbarCard`, and `Surface` use fixed padding values that are acceptable on desktop but can be dense on mobile.
- `Dialog` uses a fixed viewport subtraction and 16px overlay padding; it is safe but can be improved for small mobile viewports.
- `Drawer` side placement can occupy the full viewport width on small screens.
- `DataTable` has local horizontal scrolling but the outer wrapper should explicitly carry `min-w-0` and `max-w-full`.
- `PaginationControls` uses 36px controls; Sprint 11 responsive baseline should prefer approximately 40px touch targets.

## Risk Classification

### P0

- None found in shared primitives.

### P1

- Tablet header/filter wrapping can be too optimistic at `lg`.
- Dialog/drawer viewport bounds need stronger small-screen containment.
- DataTable wrapper should be stricter about width containment.
- Pagination touch target should align with 40px baseline.

### P2

- Mobile card density can be slightly improved with responsive padding.
