# Accessibility Baseline

## Baseline Checks

- Heading hierarchy.
- Landmarks and page regions.
- Button accessible names.
- Icon-only button labels.
- Form labels.
- Error association.
- `aria-describedby` for helper/error text.
- Dialog semantics.
- Drawer semantics.
- Focus-visible.
- Focus return.
- Keyboard navigation.
- Table semantics.
- List semantics.
- Status not relying only on color.
- Contrast in light and dark mode.
- Touch target size.
- Reduced motion.

## Known Positive Baseline

- Shared `Button`, `Dialog`, `Drawer`, `DataTable`, `ActionMenu` and feedback states already exist.
- Many icon-only actions already include `aria-label`.
- Stage 09 and Stage 10 added accessibility improvements to user/settings sections.

## Known Audit Targets

- Runtime full-screen panels.
- Native `window.confirm` flows.
- Large inline-edit tables.
- Permission matrix keyboard behavior.
- Inventory product/action table.
- Finance and Dashboard table/empty state consistency.
- Reduced-motion coverage in runtime animated controls.

## P0 Accessibility Risk

Any sprint must stop if it introduces:

- unlabeled destructive action
- keyboard-inaccessible dialog/drawer
- focus trap with no escape
- status conveyed only by color
- inaccessible runtime core action
- page-level overflow preventing keyboard users from reaching controls

