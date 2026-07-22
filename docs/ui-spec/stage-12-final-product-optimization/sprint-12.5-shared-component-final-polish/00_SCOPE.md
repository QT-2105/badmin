# Sprint 12.5 Scope

## Goal

Final presentation polish for shared UI components while preserving backward compatibility.

## Reviewed Components

- Button
- IconButton
- Surface
- Card
- StatCard
- StatusBadge
- Dialog
- ConfirmationDialog
- Drawer
- DataTable
- FilterBar
- FormSection
- Feedback states
- Skeleton
- EmptyState
- ErrorState
- Toast
- Tooltip
- Popover

## Capability Findings

| Component | Status | Decision |
| --- | --- | --- |
| Button | AVAILABLE | Add semantic loading state without changing handler contract. |
| IconButton | AVAILABLE | Existing label requirement preserved. |
| Surface / Card | AVAILABLE | No source change needed. |
| StatCard | AVAILABLE | No source change needed after Sprint 12.3. |
| StatusBadge | AVAILABLE | No source change needed; text label remains required through children. |
| Dialog / ConfirmationDialog | AVAILABLE | Existing focus trap, escape, overlay and loading lock preserved. |
| Drawer | AVAILABLE | Existing focus trap, escape, overlay and scroll handling preserved. |
| DataTable | AVAILABLE | No source change needed after previous responsive hardening. |
| FilterBar | AVAILABLE | No source change needed after density pass. |
| FormSection | AVAILABLE | Improve collapse control touch target only. |
| Feedback / EmptyState / ErrorState | AVAILABLE | No behavior change. |
| Skeleton | AVAILABLE | Allow safe HTML/ARIA props while preserving visual default. |
| Toast | MISSING | Do not create new shared component in this sprint. |
| Tooltip | MISSING | Do not create new shared component in this sprint. |
| Popover | MISSING | Do not create new shared component in this sprint. |

## Non-Goals

- Business logic.
- Permission logic.
- Store reads.
- Query/mutation behavior.
- New toast/tooltip/popover infrastructure.
