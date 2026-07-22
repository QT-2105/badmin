# Stage 12 Regression Map

## Required Validation Commands

Run after every implementation sprint:

```bash
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
```

Current package status:

- no `test` script exists in `package.json`
- no Playwright/E2E dependency exists

Do not add test infrastructure unless the owner explicitly approves it.

## Functional Regression Areas

| Area | Must verify unchanged |
| --- | --- |
| App Shell | nav labels, nav targets, collapsed persistence, mobile nav, permission visibility. |
| Dashboard | data source, report period, KPI values, chart data, recent session links. |
| Schedule | create/edit/delete play dates, create/edit/delete sessions, past-date restrictions, routes. |
| Session Workspace | player CRUD, start session, completion flow, payment fields, shuttlecock completion fields. |
| Runtime | queue order, suggestions, replacement, apply, start, end, cancel, swap, match history, hydration. |
| Finance | totals, revenue, expense, profit, transaction payload, category, deduction, sort, period. |
| Inventory | product CRUD, import, sale, play usage, adjustment, movement order, current stock, average cost. |
| Users | role codes, permission keys, user status, action visibility, server authorization. |
| Settings | local persistence, branding, max court count, destructive actions, permissions. |
| Authentication | login/logout/session behavior and redirects. |

## Visual Regression Matrix

Viewports:

- 1440x900
- 1280x800
- 1180x820
- 1024x1366
- 820x1180
- 430x932
- 390x844

Themes:

- Light
- Dark
- System if available

States:

- Loading
- Empty
- Error
- Success
- Permission restricted
- Long text
- Long currency
- No data
- Many rows
- Dialog open
- Drawer open

## Acceptance Threshold

Stage 12 implementation sprint can pass only when:

- no protected backend/logic diff
- validation commands pass
- regression map is updated
- deferred browser/device checks are either completed or explicitly carried forward with rationale
