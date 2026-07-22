# Sprint 11.2 Current Audit

## App Sidebar

- Root navigation is centralized in `src/components/app-shell.tsx`.
- Menu visibility is permission-driven through `hasPermission(currentUser, item.permission)`.
- Routes are stable: `/dashboard`, `/schedule`, `/finance`, `/inventory`, `/users`, `/settings`.
- Desktop collapsed navigation currently depends on icons and title text; explicit accessible link names should be added.
- Active state already has color, background, ring, and left indicator; expanded mode can better expose current state through text.

## Mobile Navigation

- Mobile navigation renders the same permission-filtered `visibleNavItems`.
- Link targets and active detection are shared with desktop.
- Current touch targets are close to the minimum but should be normalized to approximately 40px.
- Icon-only utility controls need consistent 40px sizing.

## Page Header and Back Action

- Shared `PageHeader` is used by Dashboard, Schedule, Play Date Detail, Session Detail, Finance, Inventory, Users, and Settings.
- Two detail pages provide `backAction` manually:
  - `src/components/schedule/play-date-detail-client.tsx`
  - `src/components/schedule/session-detail-client.tsx`
- Back links preserve the current route hierarchy and should only be visually standardized.

## Section Navigation

- Settings has local section navigation in `src/components/settings/settings-page-client.tsx`.
- Active state uses `aria-current="location"` and visual tone.
- No source change is required unless touch target or active styling regresses.

## Risk Classification

### P0

- None found in current navigation source.

### P1

- Collapsed sidebar icon-only links lack explicit accessible names.
- Back actions are visually inconsistent across detail pages.
- Mobile utility controls should align to the same touch target baseline.

### P2

- Active nav state can be clearer through visible text in expanded desktop sidebar.
- Page header back action can use a semantic navigation wrapper.
