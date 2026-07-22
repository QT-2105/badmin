# Business Regression Map

## Must Remain Unchanged

| Module | Regression checks |
| --- | --- |
| App Shell | root nav labels/targets, no runtime root nav, auth menu behavior, collapsed preference. |
| Dashboard | KPI values, report period, chart data, recent session links, no new data source. |
| Schedule | play date CRUD, session CRUD, past-date restrictions, route flow. |
| Session Workspace | player CRUD, payment status, fee handling, runtime entry, completion summary. |
| Runtime | queue order, pairing, replacement, apply, start, end, cancel, swap, match history, hydration. |
| Finance | totals, revenue, expense, profit, transaction payloads, category and deduction semantics. |
| Inventory | product CRUD, import, sale, play usage, adjustment, stock, average cost, movement order. |
| Users | role codes, permission keys, account status, permission matrix payloads, server authorization. |
| Settings | local app settings, branding, max court count, destructive actions, permissions. |
| Authentication | login, logout, session expiration, route protection. |

## Required Commands After Implementation Sprints

```bash
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
```

No `test` script exists in `package.json`; test command is currently N/A unless the project adds one separately with approval.

## Regression Evidence Required for Stage 12 Completion

- protected diff clean
- validation commands pass
- visual/device QA notes for requested viewports
- deferred checks explicitly documented
- final decision recorded as PASS, PASS WITH NOTES, FAIL or BLOCKED

