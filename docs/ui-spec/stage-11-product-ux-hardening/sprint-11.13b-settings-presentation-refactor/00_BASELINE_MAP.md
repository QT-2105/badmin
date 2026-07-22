# Sprint 11.13B — Settings Presentation Refactor Baseline

## Status

BASELINE COMPLETED

## Line Count Baseline

Command:

```bash
wc -l src/components/settings/settings-page-client.tsx
```

Result:

- `src/components/settings/settings-page-client.tsx`: 665 lines

## Function Map

| Function / block | Current responsibility | Refactor decision |
| --- | --- | --- |
| `SettingsPageClient` | Settings hooks, branding query/mutations, destructive service calls, local form state, expanded/active section state, and render all Settings UI. | Keep orchestration, hooks, state, handler logic, persistence calls, service calls, destructive confirmation state and payloads in parent. Move presentational sections out. |
| `openSection` | Sets active section and expands the selected section. | Keep in parent. |
| `handleNavigateSection` | Opens a section and performs smooth scroll with reduced-motion check. | Keep in parent because it uses `window`, `document`, and navigation behavior. |
| `handleSaveBrandingName` | Calls branding update mutation with `clubName`. | Protected in parent. |
| `handleUploadLogo` | Calls upload logo mutation with selected `File`. | Protected in parent. |
| `handleResetMatchHistory` | Calls destructive reset service and maps result into status message. | Protected in parent. |
| `handleDeleteAllPlayerImages` | Calls destructive image cleanup service and maps result into status message. | Protected in parent. |
| `handleConfirmDestructiveAction` | Dispatches pending destructive action to existing handler. | Protected in parent. |
| `SettingsCard` | Expandable settings section presentation. | Move to settings presentation file. |
| `SettingToggle` | Toggle row presentation. | Move to settings presentation file. |
| `FinanceSettingStatus` | Finance auto-setting status presentation. | Move to settings presentation file. |

## State Ownership Map

All state remains owned by `SettingsPageClient`:

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

App settings remain owned by `useAppSettings`:

- `autoCreateCourtFeeTransaction`
- `autoCreateShuttlecockUsageTransaction`
- `maxCourtCountPerSession`

Branding state remains owned by React Query hooks:

- `useBranding`
- `useBrandingMutations`

## Handler Map

Handlers that must remain parent-owned:

- `handleNavigateSection`
- `handleSaveBrandingName`
- `handleUploadLogo`
- `handleResetMatchHistory`
- `handleDeleteAllPlayerImages`
- `handleConfirmDestructiveAction`
- `setSetting`
- `setClubName`
- `setBrandingSaveState`
- `setBrandingSaveMessage`
- `setExpandedSections`
- `setActiveSection`
- `setPendingDestructiveAction`

## Query, Mutation And Service Map

Parent-owned and unchanged:

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

## Protected Functions

Protected in this sprint:

- `handleSaveBrandingName`
- `handleUploadLogo`
- `handleResetMatchHistory`
- `handleDeleteAllPlayerImages`
- `handleConfirmDestructiveAction`
- `setSetting` calls and keys
- `normalizeMaxCourtCount`
- branding mutation payloads
- destructive service calls
- settings persistence semantics

## Protected Files

Must not be modified:

- `src/hooks/use-app-settings.ts`
- `src/hooks/use-branding.ts`
- `src/lib/app-settings.ts`
- `src/services/settings-service.ts`
- `src/services/branding-service.ts`
- `src/repositories/**`
- `src/app/api/**`
- `src/lib/auth/**`
- `src/lib/badminton-store.ts`
- `src/types/domain.ts`
- `prisma/**`
- `middleware.ts`
