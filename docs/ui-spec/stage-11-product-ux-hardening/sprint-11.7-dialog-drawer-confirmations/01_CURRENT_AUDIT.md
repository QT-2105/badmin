# Sprint 11.7 Current Audit

## Shared Component Audit

| Component | Current state | Risk | Sprint 11.7 decision |
| --- | --- | --- | --- |
| `Button` | Shared variants and sizes exist. Consumers often override touch height manually. No built-in loading primitive. | Repeated loading/disabled/icon-only patterns. | Add optional `loading`, `loadingText`, and `iconOnly` props without changing defaults. |
| `IconButton` | No dedicated shared wrapper. Icon-only buttons rely on per-consumer `aria-label`. | Accessible naming can drift across consumers. | Add optional shared `IconButton` wrapper requiring `label`; migrate Dialog/Drawer close buttons only. |
| `StatusBadge` | Semantic tone exists and consumers provide text labels. | Optional icon/tooltip patterns require ad hoc wrappers. | Add optional `leading`, `aria-label`, and `title`; keep visible text label requirement at consumer level. |
| `Surface/Card` | Shared surface variants exist. | Interactive surface lacked focus ring; padding could be dense on mobile. | Add focus-visible ring for interactive variant and responsive padding/min-width containment. |
| `Dialog` | Focus trap, return focus, viewport bounds, and close behavior exist. | Close button duplicated icon-only pattern. | Use shared `IconButton`; preserve `closeDialog` and focus behavior. |
| `Drawer` | Focus trap, return focus, viewport bounds, and close behavior exist. | Close button duplicated icon-only pattern. | Use shared `IconButton`; preserve `closeDrawer` and focus behavior. |
| `DataTable` | Accessible table semantics and state slots exist. | Caption and scroll wrapper need optional consumer control. | Add optional `caption`, `captionClassName`, and `scrollClassName`; keep existing minWidth/default states. |
| `FilterBar` | Shared section/control layout already hardened in prior sprints. | No P0 issue found. | No source change in this sprint. |
| `FormSection` | Collapsible sections have icon-only control with aria label. | Visible collapse text cannot be enabled per consumer. | Add optional collapse/expand labels and visible label flag; defaults unchanged. |
| Feedback states | Shared Loading/Empty/Error/Success states exist. | Loading icon was not animated by default; icon customization repeated by consumers. | Add optional icon class props and animate default `Loader2`. |
| `Skeleton` | Existing pulse skeleton available. | No P0 issue found. | No source change. |
| KPI / `StatCard` | Semantic tones and density exist. | No optional accessible root label. | Add optional `aria-label`; keep existing visual/default rendering. |

## Consumer Audit

- `Button` consumers exist in AppShell, Dashboard, Schedule, Session Workspace, Runtime, Finance, Inventory, Users, Settings, Auth, Pagination, and ActionMenu.
- `StatusBadge` consumers retain visible text labels; no status values were changed.
- `DataTable` consumers in Dashboard, Finance, and Inventory remain compatible because new props are optional.
- `Dialog` consumer in Settings keeps existing `open`, `onOpenChange`, title, description, children, and footer behavior.
- `Drawer` currently remains a shared primitive with no business logic ownership.
- Runtime-specific components continue to use current handlers and store actions unchanged.

## Protected Confirmation Note

Native confirmation call sites and runtime leave protection remain out of this sprint. This sprint does not replace `window.confirm`, does not change destructive handlers, and does not change runtime leave-guard behavior.
