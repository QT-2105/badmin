# Before / After Matrix

| Area | Before | After | Contract |
| --- | --- | --- | --- |
| Settings navigation | Shows group, label and description. | Adds visible `Có sẵn` / `Một phần` capability chips using existing item status. | No new navigation item or route. |
| Branding dirty state | Shows dirty/saved/unchanged text. | Adds semantic border, foreground tokens and live region. | Save/reset behavior unchanged. |
| Branding save message | Uses status live region for all messages. | Uses `alert` for error and `status` for success. | Message source unchanged. |
| Toggle rows | Switch plus title/description. | Adds `Bật` / `Tắt` text and focus-within ring. | Setting key and onChange callback unchanged. |
| Finance status chips | Plain pill color. | Adds border and semantic foreground token. | Setting values unchanged. |
| Destructive feedback | Message appears as colored text. | Message appears as status/alert block. | Destructive handler unchanged. |
| Settings sections | Visual section cards. | Adds section heading association via `aria-labelledby`. | Collapse/expand behavior unchanged. |

## Handler Preservation

| Handler | Preserved |
| --- | --- |
| `onNavigateSection` | Yes |
| `onToggleSection` | Yes |
| `onClubNameChange` | Yes |
| `onResetClubName` | Yes |
| `onSaveBrandingName` | Yes |
| `onUploadLogo` | Yes |
| `onDeleteLogo` | Yes |
| `onCourtFeeTransactionChange` | Yes |
| `onShuttlecockUsageTransactionChange` | Yes |
| `onMaxCourtCountChange` | Yes |
| `onOpenDestructiveAction` | Yes |
| `onCloseDestructiveAction` | Yes |
| `onConfirmDestructiveAction` | Yes |
