# Feedback and Unsaved State Protected Files

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
