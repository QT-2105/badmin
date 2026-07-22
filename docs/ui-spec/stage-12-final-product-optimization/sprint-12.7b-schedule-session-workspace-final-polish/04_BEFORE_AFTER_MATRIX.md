# Sprint 12.7B Before / After Matrix

| Area | Before | After |
| --- | --- | --- |
| Schedule day list | Visual grid without explicit section label. | Grid has `aria-label="Danh sách ngày chơi"`. |
| Schedule expand control | Toggle label only. | Toggle also exposes `aria-expanded` and controlled region ID. |
| Schedule titles | Long titles could compress adjacent badges. | Titles can wrap with `break-words`. |
| Play Date create action | Submit width varied on small screens. | Submit is full-width on mobile, compact on desktop. |
| Play Date session list | Section label absent. | Session list has explicit accessible label. |
| Session Workspace header actions | Buttons could crowd narrow widths. | Actions wrap full-width on mobile and keep `h-10` touch target. |
| Session completion profit | Info tone regardless of value. | Negative preview uses danger tone; non-negative remains info. |
| Session player list | Visual stack without section label. | Player list has explicit accessible label. |
| Player row numbers | Less scannable on tablet widths. | Match/payment values align and use tabular numbers. |

