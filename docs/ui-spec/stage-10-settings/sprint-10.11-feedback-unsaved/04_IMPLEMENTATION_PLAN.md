# Feedback and Unsaved State Implementation Plan

Status: IN PROGRESS

## Form / Section Preservation Table

| Form/Section | Save strategy | Dirty source | Submit handler | Success behavior | Error behavior | Reset behavior | Required preservation |
|---|---|---|---|---|---|---|---|
| Branding name | Manual per-field save | Local `clubName` input vs current branding data | `brandingMutations.updateName.mutateAsync(clubName)` | Existing invalidation plus UI status | Existing mutation error plus UI status | Local input restore only | Do not alter payload, mutation, validation, cache invalidation, or API. |
| Branding logo | Immediate mutation | File chooser | Existing upload/delete mutations | Existing invalidation | Existing mutation error | None | Do not alter file validation, upload/delete handlers, or API. |
| Finance toggles | Immediate localStorage write | Not applicable | `setSetting(...)` | Immediate local update | Existing hook fallback | None | Do not alter keys/defaults/write behavior. |
| Schedule max courts | Immediate localStorage write | Not applicable | `setSetting(... normalizeMaxCourtCount(...))` | Immediate local update | Existing hook fallback | None | Do not alter normalization/clamp. |
| Appearance | Existing immediate theme behavior | Existing theme control | `ThemeToggle` internal handler | Existing behavior | Existing behavior | None | Do not alter theme key or hydration. |
| Destructive actions | Confirm then submit | Not applicable | Existing service calls | Local success message | Local error message | None | Do not alter endpoints/payloads/confirmation requirement. |

## Source Implementation Plan

Allowed source file:

- `src/components/settings/settings-page-client.tsx`

Presentation-only changes:

1. Track branding name save status in local UI state.
2. Compute branding dirty state from local input and current branding value.
3. Show unchanged/dirty/saving/saved/error status near the Branding form.
4. Add a local reset button that restores the unsaved input to the current saved branding value.
5. Add autosave presentation copy to browser-local Settings sections.
6. Keep global navigation unchanged; no route blocker or beforeunload prompt.

## Explicit Non-Changes

- No auto-save conversion.
- No debounce change.
- No optimistic update change.
- No query key or mutation change.
- No cache invalidation change.
- No API/database/repository/service change.
- No global unsaved-changes blocker.
- No whole-page save/reset strategy.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build` at checkpoint or when source changes
- `npm run guard:no-db-schema-automation` at checkpoint or completion
