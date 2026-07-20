# Visual Specification

## Page

- Use compact SaaS settings layout with clear section grouping.
- Keep information density high and avoid oversized cards.
- Preserve collapsed-by-default behavior unless an implementation task explicitly preserves and improves it.

## Section Hierarchy

- Section title: clear, operational language.
- Section description: short explanation of storage/impact.
- Editable server setting and local browser preference should be visually distinct.
- Danger sections must use danger tone and confirmation-specific hierarchy.

## Forms

- Labels must be visible and associated with controls.
- Helper text must clarify operational impact.
- Buttons must show loading/disabled state without layout shift.
- Inputs/selects/switches must use shared primitives.

## Feedback

- Loading uses shared spinner/skeleton patterns.
- Success/error states use semantic tokens.
- Destructive action success/error messages stay near the action.

## Light/Dark

- Surfaces use semantic tokens.
- Danger backgrounds remain readable in both modes.
- Button, border, focus, and disabled contrast must satisfy Stage 01/01.5 rules.

## Responsive

- Tablet layout should keep controls reachable without horizontal page overflow.
- Action groups wrap but keep labels readable.
- Touch targets should be at least about 40px.

