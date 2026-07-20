# Implementation Plan

## Current Columns And Handlers

| Column | Current data | Current handler | Required preservation |
| --- | --- | --- | --- |
| Tên đăng nhập | `user.email` | `onBlur -> handleUpdateUser(user.id, { email })` | Keep save-on-blur and payload key. |
| Tên hiển thị | `user.displayName` | `onBlur -> handleUpdateUser(user.id, { displayName })` | Keep save-on-blur and payload key. |
| Đăng nhập gần nhất | `user.lastLoginAt` | None | Keep formatter: `toLocaleString('vi-VN')`. |
| Vai trò | `user.role` | `onChange -> handleUpdateUser(user.id, { role })` | Keep `UserRole` values and handler timing. |
| Trạng thái | `user.status` | `onChange -> handleUpdateUser(user.id, { status })` | Keep `UserStatus` values and handler timing. |
| Mật khẩu mới | `userPasswords[user.id]` | Local state only | Keep local state shape. |
| Lưu | `userPasswords[user.id]` | `onClick -> handleUpdateUser(user.id, { password })` | Keep disabled condition and payload key. |

DataTable is not used in Sprint 9.2 because the current list owns inline editable controls and save-on-blur behavior. Preserving callback timing is more important than migrating the markup.

1. Document current columns and handlers.
2. Keep visible data and row ordering unchanged.
3. Improve table/list readability with shared tokens.
4. Use DataTable only if inline edit behavior and callback timing are preserved exactly.
5. Run lint and typecheck.
