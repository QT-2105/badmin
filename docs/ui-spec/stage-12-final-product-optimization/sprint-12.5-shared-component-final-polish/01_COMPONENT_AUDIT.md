# Sprint 12.5 Component Audit

## Backward Compatibility

| Component | Default behavior preserved | Optional-only capability | Handler contract unchanged |
| --- | --- | --- | --- |
| Button | Yes | `aria-busy` can still be supplied by caller | Yes |
| IconButton | Yes | Existing `label` remains required | Yes |
| ActionMenu | Yes | No new API | Yes |
| FormSection | Yes | No new API | Yes |
| Skeleton | Yes | HTML/ARIA props are now accepted | Yes |
| Dialog | Yes | No new API | Yes |
| Drawer | Yes | No new API | Yes |
| DataTable | Yes | Existing optional props retained | Yes |

## Missing Shared Components

- `Toast`: no shared component found.
- `Tooltip`: no shared component found.
- `Popover`: no shared component found.

These are documented as missing capability; this sprint does not create new infrastructure.

## Review Notes

- Button already had visual loading spinner, disabled state and focus ring. Sprint adds semantic `aria-busy` and `data-loading`.
- ActionMenu already had keyboard arrow support and Escape return focus. Sprint improves touch target size.
- FormSection collapse button was visually consistent but smaller than preferred touch target. Sprint sets it to 40px.
- Skeleton was visually stable and reduced-motion aware. Sprint lets consumers attach ARIA/HTML attributes when needed.
- Dialog/Drawer already implement portal, focus trap, Escape, overlay, body scroll lock and focus return.
