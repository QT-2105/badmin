# Appearance Preferences Implementation Plan

Status: IMPLEMENTED

## Capability Matrix

| Capability | Current source | Allowed values | Persistence | Handler | Status | Implementation decision |
|---|---|---|---|---|---|---|
| Theme | `src/components/ui/theme-toggle.tsx` | `dark`, `light` | `localStorage` key `badmin_theme` | Existing `ThemeToggle` internal handler | PARTIAL | Add Settings section using existing `ThemeToggle`. |
| System theme | None | None | None | None | MISSING | Do not implement. |
| Accent | None | None | None | None | MISSING | Do not implement. |
| Density | None | None | None | None | MISSING | Do not implement. |
| Sidebar state | `src/components/app-shell.tsx` local state | `true`, `false` | `localStorage` key `badmin_sidebar_collapsed` | AppShell internal state | PARTIAL / OUT OF SCOPE | Do not add Settings control without shared sync handler. |
| Reduced motion | CSS media query behavior | Browser/OS setting | None | None | READ_ONLY | Do not implement as app setting. |
| Language preference | None | None | None | None | MISSING | Do not implement. |

## Implementation

1. Add an Appearance Settings section for the existing theme capability only.
2. Use the existing `ThemeToggle` component to preserve preference key, allowed values, persistence, and hydration behavior.
3. Add visual preview cards using existing semantic tokens only.
4. Do not add system theme, accent, density, reduced motion, sidebar, or language settings.
5. Do not modify global design tokens.

## Protected Files

- Theme token definitions.
- App shell sidebar state behavior.
- Auth/session/user preference behavior.
- API, repository, service, Prisma/database, route, permission, query key, mutation, and cache behavior.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
