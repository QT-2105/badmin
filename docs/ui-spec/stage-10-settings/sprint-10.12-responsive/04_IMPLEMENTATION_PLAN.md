# Responsive Settings UX Implementation Plan

Status: IN PROGRESS

## Allowed Source File

- `src/components/settings/settings-page-client.tsx`

## Protected Files

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `prisma/**`
- `src/lib/app-settings.ts`
- `src/hooks/use-app-settings.ts`
- `src/hooks/use-branding.ts`
- `src/lib/auth/**`
- `src/lib/badminton-store.ts`

## Responsive Implementation Tasks

1. Change Settings navigation from overflow-first layout to responsive grid:
   - `1 column` on mobile.
   - `2 columns` on small/tablet portrait.
   - `3 columns` on tablet landscape.
   - `6 columns` on wide desktop.
2. Move main section two-column layouts from `xl` to `lg` with constrained side column width.
3. Improve `SettingToggle` stacking on mobile and alignment on tablet/desktop.
4. Tighten section padding and minimum touch targets without changing click handlers.
5. Preserve Dialog sizing and footer behavior because existing primitive already handles viewport constraints.

## Non-Changes

- Data unchanged.
- Config values unchanged.
- Handlers unchanged.
- Save strategy unchanged.
- Permission unchanged.
- Validation unchanged.
- Payload unchanged.
- Routes unchanged.
- No sticky save area added because Settings uses mixed manual and immediate-save sections.

## Viewport Check Criteria

- No page-level horizontal overflow.
- Navigation remains reachable.
- Save action remains visible in Branding section.
- Labels and helper text remain readable.
- Button text does not wrap abnormally.
- Danger actions remain visually separated from safe settings.
- Touch targets remain at least approximately 40px.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build` at checkpoint or when source changes
- `npm run guard:no-db-schema-automation` at checkpoint or completion
