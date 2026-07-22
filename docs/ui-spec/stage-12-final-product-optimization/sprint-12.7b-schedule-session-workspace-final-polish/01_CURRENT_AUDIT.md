# Sprint 12.7B Current Audit

## Schedule Page

| Area | Current issue | Decision |
| --- | --- | --- |
| Day list | Grid is visually stable but lacks explicit section label. | Add presentation-only `aria-label`. |
| Expanded session list | Expand button exposes label but not expanded state or controlled region. | Add `aria-expanded` and `aria-controls`. |
| Long day title | Long title can compete with badges on narrow widths. | Allow break-word wrapping. |

## Play Date Detail

| Area | Current issue | Decision |
| --- | --- | --- |
| Create action | Submit action can be narrower than other touch controls on small screens. | Make action full-width on mobile and auto-width on desktop. |
| Session list | List has no explicit accessible section label. | Add presentation-only `aria-label`. |
| Long session name | Long session name can create dense row pressure. | Allow break-word wrapping. |
| Detail action | Button height should align with touch target baseline. | Set `h-10`. |

## Session Workspace

| Area | Current issue | Decision |
| --- | --- | --- |
| Header actions | Multiple operational buttons can crowd tablet/mobile widths. | Give actions full-width mobile behavior and stable height. |
| Completion profit | Profit preview used info tone even for negative values. | Use existing computed value for presentation tone only. |
| Player list | Visual list has no section label. | Add `aria-label`. |
| Player row scanability | Payment and match counts can be harder to compare at tablet width. | Use right alignment on intermediate widths and tabular numbers. |

