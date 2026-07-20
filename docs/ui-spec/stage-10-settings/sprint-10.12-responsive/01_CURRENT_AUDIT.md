# Responsive Settings UX Current Audit

Status: NOT STARTED

## Findings

- Settings route and data flow were re-read before implementation.
- Current Settings page is single-column page shell with section cards.
- Navigation uses horizontal overflow on small screens and six-column grid at `lg`, which can make tablet landscape cards narrow.
- Most major setting sections split into two columns only at `xl`, causing tablet landscape to become longer than necessary.
- `SettingToggle` uses a horizontal label/control layout at all widths; this can compress helper text on narrow mobile.
- Danger sections stack safely on mobile, but action text and content density need consistent responsive treatment.
- Existing `Dialog` primitive handles viewport max height and wrapped footer, so no shared Dialog change is required.

## Viewport Audit

| Viewport | Risk | Required adjustment |
|---|---|---|
| 1440x900 | Low | Preserve dense six-column nav and two-column section layout. |
| 1280x800 | Low | Preserve two-column sections without excessive vertical scroll. |
| 1366x1024 | Low | Preserve dense layout and readable labels. |
| 1180x820 | Medium | Use tablet-friendly two-column section layout and three-column navigation. |
| 1024x1366 | Medium | Avoid six cramped navigation cards; keep cards readable. |
| 820x1180 | Medium | Keep navigation accessible without page-level horizontal overflow. |
| 390x844 | Medium | Stack toggle rows and action buttons; keep touch targets >= 40px. |

## Protected Behavior

- Search/filter does not apply to Settings.
- Save strategy remains per section or immediate local preference.
- Handler, payload, validation, route, permission, and cache behavior must remain unchanged.
