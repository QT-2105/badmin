# Stage 10 - Settings & System Configuration UX

Stage 10 improves the presentation layer for existing Settings capabilities only.

This stage must not create new configuration systems, settings APIs, database tables, repositories, services, or hard-coded business values turned into dynamic settings.

## Current Scope

- Settings route and page presentation.
- Existing club branding settings.
- Existing local browser operational preferences.
- Existing destructive maintenance actions.
- Existing feedback, validation, confirmation, loading, error, responsive, light/dark, and accessibility presentation.

## Current Source Entry Points

- Route: `src/app/settings/page.tsx`
- Client UI: `src/components/settings/settings-page-client.tsx`
- Local preferences: `src/hooks/use-app-settings.ts`, `src/lib/app-settings.ts`
- Branding data: `src/hooks/use-branding.ts`, `src/services/branding-service.ts`
- Maintenance services: `src/services/settings-service.ts`
- Branding APIs: `src/app/api/settings/branding/**`
- Image cleanup API: `src/app/api/settings/player-images/route.ts`
- Match history reset API: `src/app/api/match-history/reset/route.ts`

## Stage 10 Stop Point

This initial Stage 10 pass is documentation and audit only. Source implementation must not begin until the discovery gate, source map, protected areas, dependency graph, and sprint plan are reviewed.

