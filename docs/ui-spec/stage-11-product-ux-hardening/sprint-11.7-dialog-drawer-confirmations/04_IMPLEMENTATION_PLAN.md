# Sprint 11.7 Implementation Plan

## Task Plan

1. Audit shared component APIs and consumer usage.
2. Add optional presentation-only props to `Button`, `StatusBadge`, `DataTable`, `FormSection`, `FeedbackState`, and `StatCard`.
3. Add `IconButton` wrapper with required visible developer label for accessible icon-only controls.
4. Migrate Dialog/Drawer close controls to `IconButton` only, preserving close handlers and focus behavior.
5. Harden Surface/Card containment and interactive focus-visible styling.
6. Check consumers for backward compatibility.
7. Run validation.
8. Update Sprint completion report and project progress.

## Backward Compatibility Plan

- `Button`: default variant/size/type/children behavior remains unchanged. New loading/icon props are optional.
- `IconButton`: new export only; no existing consumer required to adopt it.
- `StatusBadge`: existing `children`, `tone`, and `className` behavior remains unchanged.
- `DataTable`: existing table rendering, minWidth, state slots, row actions, numeric alignment, pagination, and data shape remain unchanged.
- `FormSection`: existing collapsible icon-only behavior remains unchanged unless `showCollapseLabel` is explicitly enabled.
- `FeedbackState`: default Loading/Empty/Error/Success state contracts remain unchanged.
- `StatCard`: existing visual hierarchy and tone selection remain caller-owned.
- `Dialog/Drawer`: `open`, `onOpenChange`, close behavior, focus trap, and return focus remain unchanged.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run guard:no-db-schema-automation`

## Completion Criteria

- Shared components contain no business, permission, query, mutation, route, finance, inventory, or runtime logic.
- Existing consumers compile without prop changes.
- Protected file diff is clean.
- Validation commands pass.
