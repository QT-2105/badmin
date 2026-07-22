# Baseline

## Line Count Baseline

| File | Before | After | Notes |
| --- | ---: | ---: | --- |
| `src/components/settings/settings-presentation.tsx` | 762 | 791 | Increased because three local helper components were extracted; repeated inline conditional mapping decreased. |
| `src/components/settings/settings-page-client.tsx` | 188 | 188 | Unchanged. |

## State Ownership Map

| State | Owner | Sprint 12.8 Change |
| --- | --- | --- |
| `settings` | `SettingsPageClient` via `useAppSettings` | Unchanged. |
| `branding` | `SettingsPageClient` via `useBranding` | Unchanged. |
| `clubName` | `SettingsPageClient` | Unchanged. |
| `brandingSaveState` / `brandingSaveMessage` | `SettingsPageClient` | Unchanged. |
| `resetState` / `resetMessage` | `SettingsPageClient` | Unchanged. |
| `imageResetState` / `imageResetMessage` | `SettingsPageClient` | Unchanged. |
| `expandedSections` | `SettingsPageClient` | Unchanged. |
| `activeSection` | `SettingsPageClient` | Unchanged. |
| destructive dialog state | `SettingsPageClient` | Unchanged. |

## Handler Map

| Handler | Owner | Sprint 12.8 Change |
| --- | --- | --- |
| `onNavigateSection` | `SettingsPageClient` | Unchanged. |
| `onToggleSection` | `SettingsPageClient` | Unchanged. |
| `onClubNameChange` | `SettingsPageClient` | Unchanged. |
| `onResetClubName` | `SettingsPageClient` | Unchanged. |
| `onSaveBrandingName` | `SettingsPageClient` | Unchanged. |
| `onUploadLogo` | `SettingsPageClient` | Unchanged. |
| `onDeleteLogo` | `SettingsPageClient` | Unchanged. |
| `onCourtFeeTransactionChange` | `SettingsPageClient` | Unchanged. |
| `onShuttlecockUsageTransactionChange` | `SettingsPageClient` | Unchanged. |
| `onMaxCourtCountChange` | `SettingsPageClient` | Unchanged. |
| `onOpenDestructiveAction` | `SettingsPageClient` | Unchanged. |
| `onCloseDestructiveAction` | `SettingsPageClient` | Unchanged. |
| `onConfirmDestructiveAction` | `SettingsPageClient` | Unchanged. |

## Query and Mutation Map

| Query/Mutation | Owner | Sprint 12.8 Change |
| --- | --- | --- |
| `useAppSettings` | `SettingsPageClient` | Unchanged. |
| `useBranding` | `SettingsPageClient` | Unchanged. |
| `useBrandingMutations` | `SettingsPageClient` | Unchanged. |
| `resetMatchHistory` | `SettingsPageClient` service call | Unchanged. |
| `deleteAllPlayerImages` | `SettingsPageClient` service call | Unchanged. |

## Protected Functions

- `setSetting`
- `normalizeMaxCourtCount`
- `handleSaveBrandingName`
- `handleUploadLogo`
- logo delete mutation call
- `resetMatchHistory`
- `deleteAllPlayerImages`
- destructive confirmation callback sequence
