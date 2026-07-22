# Sprint 12.5 Consumer Regression

## Consumer Scope

Reviewed shared component usage across module source by static search.

Count baseline:

- Shared interactive/component consumer hits: 125.

## Regression Checks

| Area | Result | Notes |
| --- | --- | --- |
| Button consumers | PASS | Existing `children`, `onClick`, `type`, `disabled`, `loading`, `loadingText`, `variant`, `size` contract preserved. |
| IconButton consumers | PASS | Existing `label` and accessible name behavior preserved. |
| ActionMenu consumers | PASS | `onSelect` behavior and keyboard handling preserved; only touch target size changed. |
| FormSection consumers | PASS | Expand/collapse state and labels preserved; only collapse button size changed. |
| Skeleton consumers | PASS | Existing `className` consumer still works; extra HTML props are optional. |
| Dialog/ConfirmationDialog consumers | PASS | No source change; loading close lock preserved. |
| Drawer consumers | PASS | No source change; focus trap and scroll behavior preserved. |
| DataTable consumers | PASS | No source change; sorting/filtering/pagination owned by callers remain unchanged. |

## Missing Components

Toast, Tooltip and Popover are not present as shared UI primitives. Creating them would be new infrastructure and is deferred.

## Protected Diff

Protected backend/runtime/business files remain unchanged by this sprint.
