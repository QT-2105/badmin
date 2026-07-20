# Discovery Audit Protected Files

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `prisma/**`
- `src/lib/app-settings.ts`
- `src/hooks/use-app-settings.ts`
- `src/hooks/use-branding.ts`
- `src/lib/auth/**`
- `src/lib/badminton-store.ts`
- `runtime logic`
- `finance calculations`
- `inventory calculations`
- `permission logic`
- `routes`
- `query keys`
- `mutations`
- `configuration keys`
- `configuration storage`
- `default values`
- `fallback behavior`
- `save payload`
- `reset payload`
- `environment variable names`
- `environment variable semantics`
- `notification delivery logic`
- `export logic`
- `import logic`
- `backup logic`
- `restore logic`

## Protected Functions

- `readAppSettings`
- `writeAppSettings`
- `normalizeMaxCourtCount`
- `useAppSettings` state and persistence behavior
- `useBranding` query key and mutation invalidation behavior
- `updateBrandingName`
- `updateBrandingLogo`
- `deleteBrandingLogo`
- `resetMatchHistory`
- `deleteAllPlayerImages`
- S3 upload/delete/list helpers
- Auth guards and permission checks
