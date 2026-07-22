# Sprint 11.13B — Post Refactor Map

## Status

COMPLETED

## Line Count Comparison

| File | Before | After | Notes |
| --- | ---: | ---: | --- |
| `src/components/settings/settings-page-client.tsx` | 665 | 188 | Parent now owns settings orchestration, state, persistence calls, mutations, destructive service calls, scroll behavior and handler dispatch. |
| `src/components/settings/settings-presentation.tsx` | 0 | 727 | New presentation-only module for Settings layout, navigation, sections, destructive confirmation UI and local visual helpers. |

## Decomposition Implemented

`SettingsPageClient`

- Keeps `useAppSettings`.
- Keeps `useBranding`.
- Keeps `useBrandingMutations`.
- Keeps `normalizeMaxCourtCount`.
- Keeps `resetMatchHistory`.
- Keeps `deleteAllPlayerImages`.
- Keeps all settings, branding, destructive-action and navigation state.
- Keeps all mutation/service call handlers.
- Keeps all settings keys and payload values.

Presentation module:

- `SettingsPageView`
- `SettingsNavigation`
- `BrandingSection`
- `FinanceSettingsSection`
- `AppearanceSettingsSection`
- `ScheduleSettingsSection`
- `DestructiveActionSection`
- `SettingsDestructiveDialog`
- Local presentation helpers: `SettingsCard`, `SettingToggle`, `FinanceSettingStatus`.

## State Ownership After Refactor

All state remains parent-owned in `SettingsPageClient`:

- `clubName`
- `resetState`
- `resetMessage`
- `imageResetState`
- `imageResetMessage`
- `brandingSaveState`
- `brandingSaveMessage`
- `pendingDestructiveAction`
- `expandedSections`
- `activeSection`

Child components receive values and callbacks only.

## Handler Preservation

| Handler | Location after refactor | Preservation |
| --- | --- | --- |
| `openSection` | Parent | Preserved. |
| `handleToggleSection` | Parent | Extracted from previous inline toggle blocks with same state updates. |
| `handleNavigateSection` | Parent | Preserved with existing `requestAnimationFrame`, reduced-motion check and `scrollIntoView`. |
| `handleClubNameChange` | Parent | Extracted from previous inline input change block with same state resets. |
| `handleResetClubName` | Parent | Extracted from previous inline reset button block with same state resets. |
| `handleSaveBrandingName` | Parent | Preserved. |
| `handleUploadLogo` | Parent | Preserved. |
| `handleResetMatchHistory` | Parent | Preserved. |
| `handleDeleteAllPlayerImages` | Parent | Preserved. |
| `handleConfirmDestructiveAction` | Parent | Preserved. |

## Query, Mutation And Service Preservation

The following remain only in `SettingsPageClient`:

- `useAppSettings`
- `useBranding`
- `useBrandingMutations`
- `brandingMutations.updateName.mutateAsync(clubName)`
- `brandingMutations.uploadLogo.mutateAsync(file)`
- `brandingMutations.deleteLogo.mutateAsync()`
- `resetMatchHistory()`
- `deleteAllPlayerImages()`
- `setSetting(...)`
- `normalizeMaxCourtCount(...)`

No hook, query key, mutation, cache invalidation, service call, localStorage persistence logic, route logic, permission logic, or config normalization was moved into the presentation module.

## Settings Key Preservation

The following settings keys remain parent-owned and unchanged:

- `autoCreateCourtFeeTransaction`
- `autoCreateShuttlecockUsageTransaction`
- `maxCourtCountPerSession`

## Payload Preservation

Branding name payload remains:

```ts
clubName
```

Logo upload payload remains:

```ts
file
```

Logo delete mutation remains:

```ts
brandingMutations.deleteLogo.mutateAsync()
```

Match history destructive action remains:

```ts
resetMatchHistory()
```

Player image destructive action remains:

```ts
deleteAllPlayerImages()
```

Max court count setting remains:

```ts
setSetting('maxCourtCountPerSession', normalizeMaxCourtCount(value))
```

Finance auto settings remain:

```ts
setSetting('autoCreateCourtFeeTransaction', checked)
setSetting('autoCreateShuttlecockUsageTransaction', checked)
```

## Protected Logic Confirmation

- Configuration keys unchanged.
- Configuration storage unchanged.
- Default values unchanged.
- Validation/normalization unchanged.
- Save payloads unchanged.
- Destructive service calls unchanged.
- Branding API mutations unchanged.
- Settings persistence semantics unchanged.
- Runtime, finance and inventory behavior unchanged.
