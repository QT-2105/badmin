# Sprint 11.4 Implementation Plan

## Task 1 - Shared Layout Breakpoints

- Keep Tailwind default breakpoints.
- Shift shared PageHeader and FilterBar horizontal behavior later where it improves tablet wrapping.
- Preserve all props and children order.

## Task 2 - Card and Form Density

- Make shared card/surface padding responsive on small screens.
- Preserve card semantics and component APIs.

## Task 3 - Dialog and Drawer Bounds

- Tighten mobile viewport bounds and responsive padding.
- Preserve focus trap, close behavior, outside click behavior, and props.

## Task 4 - DataTable and Pagination Containment

- Ensure DataTable and pagination do not cause page-level overflow.
- Normalize pagination touch targets to approximately 40px.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Completion Criteria

- Shared primitives are more robust at 390px through 1920px.
- No new custom breakpoint is introduced.
- No domain logic or content priority changes.
- Validation passes.
