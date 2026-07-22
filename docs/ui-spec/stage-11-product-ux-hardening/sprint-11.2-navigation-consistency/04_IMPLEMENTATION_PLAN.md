# Sprint 11.2 Implementation Plan

## Task 1 - App Sidebar

- Add explicit accessible labels to desktop sidebar links.
- Normalize collapsed/sidebar control touch target.
- Make expanded active state clearer with non-routing presentation only.
- Preserve `navGroups`, permission filtering, `href`, and active detection.

## Task 2 - Mobile Navigation

- Normalize mobile nav link and utility control touch targets to approximately 40px.
- Add explicit accessible labels to mobile module links.
- Preserve current permission-filtered item list.

## Task 3 - Page Header Back Action

- Wrap shared `PageHeader` `backAction` in a semantic navigation container.
- Preserve PageHeader props and caller API.

## Task 4 - Schedule Detail Back Links

- Standardize back-link visual treatment on Play Date Detail and Session Detail.
- Preserve current `href` values and fallback route behavior.

## Validation

- `npm run lint`
- `npm run typecheck`
- `npm run build`

## Completion Criteria

- No route, query, permission, handler, or protected logic change.
- Navigation active state remains visible and has accessible state.
- Mobile navigation preserves access to every permission-visible module.
- Touch targets are normalized for nav controls.
- Validation passes.
