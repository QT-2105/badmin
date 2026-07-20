# Component Dependency Graph

```text
Settings Page
-> AppShell
-> SettingsPageClient
   -> PageShell
   -> PageHeader
   -> SettingsCard (custom presentation)
      -> BrandLogo
      -> Button
      -> Input
      -> Switch
   -> useBranding
      -> branding-service
      -> /api/settings/branding
      -> branding-repository
      -> app_settings + S3
   -> useAppSettings
      -> app-settings helper
      -> localStorage badmin_app_settings
   -> settings-service
      -> /api/match-history/reset
      -> /api/settings/player-images
```

## External Callers Of Local Settings

```text
useAppSettings
-> PlayDateDetailClient
   -> maxCourtCountPerSession
-> SessionDetailClient
   -> autoCreateCourtFeeTransaction
   -> autoCreateShuttlecockUsageTransaction
   -> complete session payload
```

## Protected Boundary

Shared UI components may improve presentation but must not own settings semantics, S3 semantics, completion transaction behavior, or destructive cleanup rules.

