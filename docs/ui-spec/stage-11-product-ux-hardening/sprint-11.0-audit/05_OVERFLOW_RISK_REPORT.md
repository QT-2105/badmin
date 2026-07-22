# Overflow Risk Report

## Static Findings

Patterns found:

- `overflow-x-auto`
- `overflow-auto`
- `overflow-y-auto`
- `overflow-hidden`
- `min-w-*`
- sticky headers
- fixed overlays

No `w-screen` or `100vw` usage was found.

## High-Risk Areas

| Area | File | Current pattern | Risk |
| --- | --- | --- | --- |
| Dashboard page shell | `src/components/dashboard/dashboard-page-client.tsx` | `PageShell minWidth="min-w-[720px] md:min-w-0"` | Mobile smoke must verify no page-level horizontal overflow. |
| Dashboard chart | `src/components/dashboard/dashboard-page-client.tsx` | `min-w-max` chart bars | Intended internal overflow; needs scroll affordance. |
| Users table | `src/components/users/auth-users-panel.tsx` | `overflow-auto`, `min-w-[1180px]` | Intended internal scroll; verify mobile and keyboard access. |
| Runtime player panel | `src/components/sections/player-database-panel.tsx` | `overflow-x-auto`, sticky header | Intended runtime full-screen table; verify tablet portrait. |
| Runtime controls | `src/components/realtime-dashboard.tsx` | horizontal overflow on stat/mode controls | Dense operational controls; verify touch/scroll on tablet. |
| Inventory tables | `src/components/inventory/inventory-page-client.tsx` | wide product and movement table/list surfaces | Verify table-local scroll and number readability. |
| Dialog/drawer overlays | `src/components/ui/dialog.tsx`, `src/components/ui/drawer.tsx` | fixed overlays | Verify internal content scroll on small viewports. |

## Overflow Acceptance

- Container-local horizontal scroll is acceptable for operational tables.
- Page-level horizontal overflow is not acceptable.
- Sticky regions must not hide controls.
- Tables must preserve a way to inspect long values.

