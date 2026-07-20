# Visual Specification

## Page Header

- Use the existing `PageHeader`.
- Keep copy operational and concise.
- Avoid marketing copy.
- Do not imply missing capabilities such as invites or audit logs.

## User Create Form

- Keep a compact form layout.
- Group login name, display name, password, and role.
- Preserve required fields and browser autocomplete.
- Present submit loading clearly.
- Error messages should use semantic danger tokens.

## User List

- Prefer shared `DataTable` if migration can preserve inline edit behavior exactly.
- If DataTable cannot safely preserve inline blur saves, keep existing structure and only token/spacing polish.
- Numeric/time values should be readable and aligned.
- Status should use semantic text plus badge color.
- Password update action must remain explicit and disabled until a password is entered.

## Role Permission Section

- Keep fixed role selector.
- Owner lock must remain visually clear.
- Permission groups should be scannable and compact.
- Checkbox rows require clear focus, hover, checked, and disabled states.
- Save action must be visually secondary but easy to locate.

## Light / Dark

- Use semantic tokens only.
- Do not hard-code theme colors.
- Ensure badge text remains readable in both modes.

## Responsive

- Desktop: two primary sections can use full width.
- Tablet landscape: table must keep a bounded horizontal scroll container.
- Tablet portrait/mobile: actions remain reachable, no page-level horizontal overflow.

## Accessibility

- Every form control must have an accessible label.
- Permission checkboxes must expose checked/disabled states.
- Expand/collapse control must expose expanded state if changed.
- Errors should be near the related section.
- Keyboard focus order must follow visual order.
