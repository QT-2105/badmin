# Current Audit

The current user table uses an internal horizontal scroll container and fixed min width.

Tablet risks:

- Dense inline inputs.
- Permission matrix cards may require scrolling.
- Actions must remain reachable.

## Responsive Baseline

| Area | Current behavior | Risk | Sprint decision |
| --- | --- | --- | --- |
| Create-user form | Collapses vertically, then dense multi-column layout on large screens | Tablet landscape can become too dense before desktop widths | Use 2-column tablet layout and reserve dense 5-column row for wider screens. |
| Role cards | 2 columns on small/tablet, 4 columns on wide screens | Acceptable but spacing can be tighter | Keep existing cards, only refine breakpoint. |
| User table | Internal horizontal scroll with fixed minimum width | Page must not gain global overflow; action column must remain reachable | Keep internal scroll, reduce minimum width on tablet, preserve columns/actions. |
| Email/display name fields | Inline editable inputs | Long values can be hard to inspect | Add `title` for full-value hover inspection without changing value or handler. |
| Permission matrix | Responsive grid at medium screens | Tablet portrait can feel cramped | Use later breakpoint for two-column matrix and keep cards full-width longer. |
| Save controls | Inline buttons | Button text can wrap in dense grids | Add no-wrap presentation only. |

## Protected Contract

- User data source unchanged.
- User ordering unchanged.
- Pagination behavior unchanged.
- Role/status values unchanged.
- Permission group/data source unchanged.
- Inline save-on-blur handlers unchanged.
- Password save handler unchanged.
- Role-permission save handler unchanged.
- No action hidden or added for responsive reasons.
