# Before / After Matrix

| Area | Before | After | Contract |
| --- | --- | --- | --- |
| Default role badge | Visible default role text only. | Added title and accessible label with the existing role. | Role value unchanged. |
| User role badge | Role label visible. | Role label keeps text; title exposes role code for inspection. | Role value and select options unchanged. |
| User status badge | Text label and helper text visible. | Added title and accessible label tied to existing status. | Status values unchanged. |
| User list header | Sticky table header. | Added subtle elevation for dense scroll context. | Data order unchanged. |
| Role/permission counts | Plain numeric text. | Tabular-number presentation for scanability. | Counts use existing values. |
| Permission rows | Color and label indicate state. | Added focus-visible ring, row title and wrapped label text. | Permission key and toggle handler unchanged. |
| Role cards | User/permission count cards. | Count values use tabular-number presentation. | Role counts and permission counts unchanged. |

## Handler Preservation

| Handler | Preserved |
| --- | --- |
| `onCreateUser` | Yes |
| `onUserEmailBlur` | Yes |
| `onUserDisplayNameBlur` | Yes |
| `onUserRoleChange` | Yes |
| `onUserStatusChange` | Yes |
| `onUserPasswordChange` | Yes |
| `onSaveUserPassword` | Yes |
| `onSelectedRoleChange` | Yes |
| `onTogglePermission` | Yes |
| `onSaveRolePermissions` | Yes |
