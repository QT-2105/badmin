# Responsive Matrix

Target viewports:

- Desktop: `1440x900`
- Laptop: `1280x800`
- Tablet landscape: `1366x1024`, `1180x820`
- Tablet portrait: `1024x1366`, `820x1180`
- Mobile smoke: `390x844`

| Module | Desktop | Laptop | Tablet landscape | Tablet portrait | Mobile | Risk |
| --- | --- | --- | --- | --- | --- | --- |
| App Shell | OK | OK | Review | Review | Review | Mobile nav overflow and sidebar transition. |
| Dashboard | OK | OK | Review | Review | Review | `PageShell minWidth="min-w-[720px]"` must not create page-level overflow on mobile. |
| Schedule | OK | OK | OK | Review | Review | Card actions must remain touch-friendly. |
| Session Workspace | OK | Review | Review | Review | Review | Inline edit/player form density. |
| Runtime | Review | Review | Risk | Risk | Review | Primary tablet surface; dense controls, courts, queue and next-match area. |
| Finance | OK | OK | Review | Review | Review | Transaction list readability and form wrapping. |
| Inventory | Review | Review | Review | Risk | Risk | Wide product/movement tables and large form component. |
| Users | Review | Review | Review | Risk | Risk | Wide user table and permission matrix. |
| Settings | OK | OK | OK | Review | Review | Recently hardened; verify section nav and dialogs. |

## Responsive Baseline Findings

- No `w-screen` or `100vw` usage was found in `src`.
- `min-w-*` usage is common and often intentional for truncation/table layout.
- Wide tables should use internal scroll containers.
- Stage 11 should verify that `overflow-x-auto` does not escape module surfaces.

## Highest Responsive Risk

1. Runtime on tablet landscape and portrait.
2. Inventory on tablet portrait and mobile.
3. Users table/permission matrix on tablet portrait and mobile.
4. Dashboard min-width shell on mobile smoke.

