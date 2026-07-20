# Feedback and Unsaved State Current Audit

Status: NOT STARTED

## Source Audit Summary

- Branding name uses manual save through `brandingMutations.updateName.mutateAsync(clubName)`.
- Branding logo upload/delete uses immediate mutation on file selection or delete button.
- Finance completion toggles use immediate localStorage persistence through `setSetting(...)`.
- Schedule max court count uses immediate localStorage persistence through `setSetting('maxCourtCountPerSession', normalizeMaxCourtCount(value))`.
- Appearance theme uses existing `ThemeToggle` immediate browser-local persistence.
- Destructive maintenance actions use explicit confirmation and local loading/success/error messages.
- There is no global navigation blocker or existing unsaved-changes architecture.
- There is no whole-page save strategy.

## Form / Section Preservation Table

| Form/Section | Save strategy | Dirty source | Submit handler | Success behavior | Error behavior | Reset behavior | Required preservation |
|---|---|---|---|---|---|---|---|
| Branding name | Manual per-field save | `clubName` differs from `branding.clubName` | `brandingMutations.updateName.mutateAsync(clubName)` | Query invalidation in hook | Mutation error | Local input can be restored to current server value | Keep payload, mutation, query key, invalidation, validation unchanged. |
| Branding logo | Immediate mutation | File selection | `brandingMutations.uploadLogo.mutateAsync(file)` / `deleteLogo.mutateAsync()` | Query invalidation in hook | Mutation error | No reset source | Keep file validation and handlers unchanged. |
| Finance toggles | Immediate localStorage write | Not applicable | `setSetting(...)` | Local state updates immediately | Hook fallback only | No reset handler | Keep keys, defaults, and write strategy unchanged. |
| Schedule max courts | Immediate localStorage write | Not applicable | `setSetting('maxCourtCountPerSession', normalizeMaxCourtCount(value))` | Local state updates immediately | Hook fallback only | No reset handler | Keep normalization, clamp, and localStorage behavior unchanged. |
| Appearance theme | Immediate localStorage preference | Existing `ThemeToggle` state | `ThemeToggle` internal handler | Existing theme hydration | Existing theme behavior | No reset handler | Keep preference key and hydration unchanged. |
| Destructive actions | Confirm then submit | Not applicable | Existing service calls | Local message | Local message | No restore source | Keep handlers, API, payload, and confirmation unchanged. |

## Implementation Candidate

- Add presentation-only dirty state for Branding name.
- Add save loading/success/error status text for Branding name.
- Add local "Hoàn tác" control to restore unsaved input to current server value.
- Add "Tự lưu" copy/status to localStorage-backed settings without changing write behavior.
- Do not add global navigation blocker.
