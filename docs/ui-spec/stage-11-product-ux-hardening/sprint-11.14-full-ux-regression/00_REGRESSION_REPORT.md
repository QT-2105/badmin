# Sprint 11.14 — Full UX Regression Report

## Final Result

PASS WITH NOTES

## Scope

Sprint 11.14 performed a full UX regression pass across the current Stage 11 work without changing product source code.

Checked modules:

- App Shell
- Dashboard
- Schedule
- Session Workspace
- Runtime
- Finance
- Inventory
- Users
- Settings

## Source Change Policy

No source code was changed during Sprint 11.14.

Only documentation/progress was updated:

- `docs/ui-spec/stage-11-product-ux-hardening/sprint-11.14-full-ux-regression/00_REGRESSION_REPORT.md`
- `docs/ui-spec/PROJECT_PROGRESS.md`

## Validation Results

| Command | Result |
| --- | --- |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run build` | PASS |
| `npm run guard:no-db-schema-automation` | PASS |
| Existing `npm run test` | N/A - no `test` script exists in `package.json` |
| Existing browser/E2E test | N/A - no Playwright dependency or E2E script exists |

## Static Regression Scans

| Scan | Result | Notes |
| --- | --- | --- |
| `window.confirm` / `window.alert` in `src` | PASS | No matches. |
| Overflow/fixed/sticky scan | PASS WITH NOTES | Matches are expected local-scroll regions, runtime overlays, sticky runtime/table headers, dialogs/drawers, and responsive table/matrix containers. No source change made. |
| ARIA/focus semantics scan | PASS WITH NOTES | Shared dialog/drawer/action menu/form/table primitives expose accessible names and semantics; remaining runtime custom panels are protected presentation with existing ARIA coverage. |
| Component size report | PASS WITH NOTES | Large presentation modules remain after Stage 11 decomposition: Inventory presentation, Users presentation, Session Detail, Settings presentation, Runtime dashboard, Finance presentation. No logic change required. |
| Dialog/confirmation scan | PASS | Shared `Dialog`, `Drawer`, `ConfirmationDialog`, and `ActionMenu` are used for current UI confirmation/menu flows. |

## Viewport Matrix

Viewport targets:

- 1440x900
- 1280x800
- 1180x820
- 1024x1366
- 820x1180
- 430x932
- 390x844

| Module | 1440x900 | 1280x800 | 1180x820 | 1024x1366 | 820x1180 | 430x932 | 390x844 | Result |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| App Shell | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | PASS WITH NOTES |
| Dashboard | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | PASS WITH NOTES |
| Schedule | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | PASS WITH NOTES |
| Session Workspace | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | PASS WITH NOTES |
| Runtime | Static pass | Static pass | Static pass | Static pass | Static pass | Smoke only | Smoke only | PASS WITH NOTES |
| Finance | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | PASS WITH NOTES |
| Inventory | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | PASS WITH NOTES |
| Users | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | PASS WITH NOTES |
| Settings | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | Static pass | PASS WITH NOTES |

Notes:

- No automated browser viewport runner exists in the project.
- No Playwright dependency is installed.
- This sprint did not add test infrastructure.
- Real screenshot/device QA remains deferred to a dedicated browser QA pass.

## Theme Matrix

| Theme | Result | Notes |
| --- | --- | --- |
| Light | PASS WITH NOTES | Token-based presentation remains in source; no screenshot QA in this sprint. |
| Dark | PASS WITH NOTES | Dark-aware classes and tokens remain in source; no screenshot QA in this sprint. |
| System | PASS WITH NOTES | Theme behavior remains owned by existing theme preference logic; no persistence or hydration logic changed. |

## State Matrix

| State | Result | Notes |
| --- | --- | --- |
| Loading | PASS WITH NOTES | Shared `DataTable`, `Skeleton`, and feedback states present across modules. |
| Empty | PASS WITH NOTES | Shared/standard empty states present across key table/list regions. |
| Error | PASS WITH NOTES | Retry/error presentation present where handlers exist. |
| Success | PASS WITH NOTES | Form/action success feedback remains presentation-only. |
| Permission restricted | PASS WITH NOTES | Permission decisions remain in existing module containers/hooks; no source change in Sprint 11.14. |
| Long text | PASS WITH NOTES | Static scan confirms `min-w-0`, truncation, break-words, and local scroll patterns in key modules. |
| Long currency | PASS WITH NOTES | Finance/Inventory numeric fields retain tabular/right-aligned display from prior sprints. |
| No data | PASS WITH NOTES | Empty state paths remain in current presentation. |
| Many rows | PASS WITH NOTES | DataTable/table regions use local overflow/pagination patterns. |
| Dialog open | PASS WITH NOTES | Shared Dialog portal/focus behavior remains in source. |
| Drawer open | PASS WITH NOTES | Shared Drawer portal/focus behavior remains in source. |

## Functional Regression Matrix

| Area | Expected preservation | Result |
| --- | --- | --- |
| Schedule CRUD | Handlers, mutations, payloads, routes unchanged. | PASS WITH NOTES |
| Session CRUD | Handlers, mutations, payloads, routes unchanged. | PASS WITH NOTES |
| Runtime queue | Runtime store and queue ordering unchanged. | PASS WITH NOTES |
| Pairing | Runtime pairing helpers/store unchanged. | PASS WITH NOTES |
| Court assignment | Court assignment handlers/store unchanged. | PASS WITH NOTES |
| Match lifecycle | Start/end/apply/swap flow unchanged. | PASS WITH NOTES |
| Finance totals | Finance calculation helper unchanged. | PASS WITH NOTES |
| Revenue | Revenue calculation unchanged. | PASS WITH NOTES |
| Expense | Expense calculation unchanged. | PASS WITH NOTES |
| Profit | Profit calculation unchanged. | PASS WITH NOTES |
| Inventory stock | Inventory repository/service/schema unchanged. | PASS WITH NOTES |
| Average cost | Average cost calculation unchanged. | PASS WITH NOTES |
| User permissions | Auth hooks/lib/API/schema unchanged. | PASS WITH NOTES |
| Settings persistence | App settings/branding hooks/API unchanged. | PASS WITH NOTES |

## Protected Diff

Protected diff checked clean for:

- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `src/hooks/**`
- `src/lib/badminton-store.ts`
- `src/lib/auth/**`
- `src/lib/finance-calculation.ts`
- `src/lib/app-settings.ts`
- `src/types/domain.ts`
- `prisma/**`
- `middleware.ts`

## Deferred Items

- Browser screenshot QA across the requested viewport matrix.
- Real-device tablet and mobile QA.
- Live data QA for loading, empty, error, permission-restricted, long-text, long-currency, many-row, dialog-open, and drawer-open states.
- Automated E2E coverage for Schedule CRUD, Session CRUD, Runtime lifecycle, Finance transaction creation, Inventory movements, Users permissions, and Settings persistence.

## Out Of Scope

- Adding Playwright, Cypress, or any new test infrastructure.
- Changing business logic to make a UI state easier to test.
- Changing runtime, finance, inventory, auth, settings, API, repository, service, Prisma, query keys, mutations, payloads, permissions, or routes.

## Stop Condition

Sprint 11.14 is complete and stops here. No next sprint is started.
