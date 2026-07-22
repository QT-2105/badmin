# Responsive Baseline

## Target Viewports

- Desktop: `1440x900`
- Laptop: `1280x800`
- Tablet landscape: `1366x1024`, `1180x820`
- Tablet portrait: `1024x1366`, `820x1180`
- Mobile smoke: `390x844`

## Global Requirements

- No page-level horizontal overflow.
- All module actions remain reachable.
- Wide tables scroll inside their own container.
- Runtime court management remains usable on tablet landscape.
- Touch targets should be approximately 40px minimum.
- Button text should not wrap unexpectedly.
- Dialog and drawer content should not overflow off-screen without an internal scroll region.

## Module Baseline

| Module | Baseline | Risk |
| --- | --- | --- |
| App Shell | Desktop fixed sidebar, mobile sticky top nav | Mobile nav horizontal scroll and focus visibility. |
| Dashboard | Page shell includes min-width safeguard for chart/table | Verify mobile smoke and chart scroll affordance. |
| Schedule | Card and form layouts already responsive | Destructive confirm still native; verify touch targets. |
| Session Workspace | Dense player/payment forms and completion modal | Verify mobile stacking and inline edit controls. |
| Runtime | Tablet-first layout with full-screen panels | Highest risk for overflow and touch density. |
| Finance | Compact KPI/form/table presentation | Transaction table scroll and form width. |
| Inventory | Wide product/movement tables and forms | Highest non-runtime table overflow risk. |
| Users | Wide table and permission matrix | Needs container-local scroll and long email handling. |
| Settings | Recently hardened responsive grid | Verify confirmation dialog and section navigation. |

