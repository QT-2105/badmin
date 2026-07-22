# Release Candidate Report

## RC Identifier

`BADMIN-RC-STAGE12-2026-07-22-fix-ui-d2647a7`

This RC evaluates the current workspace state on top of commit `d2647a7`.

## Commit / Branch Assessed

| Item | Value |
| --- | --- |
| Branch | `fix-ui` |
| Commit | `d2647a7` |
| Working tree | Dirty, containing Stage 11/12 documentation and presentation-layer changes |
| Source-change scope | Presentation-layer source changes from earlier Stage 12 sprints; Sprint 12.13 is documentation-only |

## Environment

| Item | Value |
| --- | --- |
| Project | `badmin` |
| Version | `0.1.0` |
| Runtime | Node `v20.11.0` |
| Package manager | npm `10.8.1` |
| Framework | Next.js `15.5.18` from build output |
| Workspace | `/Users/admin/badmin` |
| Date | 2026-07-22 |
| Timezone | Asia/Ho_Chi_Minh |

## Validation Commands

```bash
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
git diff --check
git diff --name-only -- src/app/api src/repositories src/services src/hooks src/lib/badminton-store.ts src/lib/auth src/lib/finance-calculation.ts src/lib/app-settings.ts src/types/domain.ts prisma middleware.ts
```

Existing tests were checked through `package.json`; no `test` script exists.

## Validation Results

| Command | Result | Notes |
| --- | --- | --- |
| `npm run lint` | PASS | ESLint completed with `--max-warnings=0`. |
| `npm run typecheck` | PASS | `tsc --noEmit` completed. |
| `npm run build` | PASS | Next.js production build completed. |
| `npm run guard:no-db-schema-automation` | PASS | DB schema automation guard passed. |
| `git diff --check` | PASS | No whitespace/check errors. |
| Protected backend/logic diff | PASS | No diff in protected backend/domain paths. |
| Existing tests | NOT APPLICABLE | No `test` script or discovered test files are present. |

## Module Readiness

| Module | Readiness | Notes |
| --- | --- | --- |
| App Shell | READY WITH NOTES | Navigation, shell surfaces and active states are RC-ready; mobile drawer requires browser QA. |
| Dashboard | READY WITH NOTES | KPI and overview hierarchy are strong; chart and long-currency screenshot QA remains. |
| Schedule | READY WITH NOTES | CRUD presentation and confirmations are ready; dense mobile cards require real viewport QA. |
| Session Workspace | READY WITH NOTES | Preparation flow is ready; large presentation file remains a maintainability note. |
| Runtime | READY WITH NOTES | Operator flow, court cards, queue and next-match presentation are RC-ready; real tablet rehearsal remains required. |
| Finance | READY WITH NOTES | KPI/table/form presentation is ready; automated finance fixture regression is missing. |
| Inventory | READY WITH NOTES | Stock, movement and tube/piece presentation are ready; automated stock/average-cost fixture regression is missing. |
| Users | READY WITH NOTES | Role/status/permission presentation is safer; permission matrix keyboard QA remains. |
| Settings | READY WITH NOTES | Existing capabilities are represented honestly; missing capabilities are not faked. |

## Responsive Readiness

Status: READY WITH NOTES.

Evidence:

- Stage 11 and Sprint 12.10 documented viewport coverage for desktop, tablet landscape, tablet portrait and mobile.
- Page-level horizontal overflow was statically reviewed.
- Wide tables and matrix-style content keep local scroll containers where needed.

Notes:

- Browser screenshot QA for the final viewport matrix is still deferred.
- Runtime tablet landscape and tablet portrait should be manually rehearsed before production field use.

## Accessibility Readiness

Status: READY WITH NOTES.

Evidence:

- Accessible labels, non-color-only statuses, focus-visible states, dialog semantics and reduced-motion support were documented and improved through Stage 11/12.
- `window.confirm` and `window.alert` were confirmed absent during Sprint 12.10.

Notes:

- Automated axe/WCAG contrast tooling is not available.
- Dialog focus trap/return and permission matrix keyboard behavior need browser verification.

## Design Readiness

Status: READY WITH NOTES.

Evidence:

- Color tokens and surface hierarchy were improved in Sprint 12.1.
- Typography, border, surface and elevation were normalized in Sprint 12.2.
- KPI semantics were normalized in Sprint 12.3.
- Shared component final polish was completed in Sprint 12.5.

Notes:

- Runtime custom palette needs measured contrast review.
- Missing shared Toast, Tooltip and Popover primitives remain future scope.

## Runtime Regression

Status: PASS WITH NOTES.

Confirmed unchanged by source scope and protected diff:

- waiting queue ordering
- `PRIORITY` / `WAITING` behavior
- `JUST_FINISHED` behavior
- pairing algorithm
- court assignment
- next-match generation
- apply behavior
- start match
- end match
- swap pair behavior
- status transitions
- Zustand actions
- API calls

Note:

- Live operator workflow execution still requires interactive browser or E2E coverage.

## Finance Regression

Status: PASS WITH NOTES.

Confirmed unchanged:

- revenue formula
- expense formula
- profit formula
- category semantics
- payment status
- payment method
- session relation
- query keys
- mutations
- payloads
- API contracts

Note:

- No automated finance fixture regression exists.

## Inventory Regression

Status: PASS WITH NOTES.

Confirmed unchanged:

- `current_stock`
- `average_cost`
- movement calculation
- tube-to-piece conversion
- movement type semantics
- movement order
- movement payload
- API contracts
- validation

Note:

- No automated inventory fixture regression exists.

## Known Issues

| Priority | Issue |
| --- | --- |
| P1 | Browser screenshot QA is missing for final viewport/theme coverage. |
| P1 | Real tablet Runtime QA is required before production operations. |
| P1 | Automated E2E/business regression tests are not present. |
| P1 | Automated accessibility/contrast checks are not present. |
| P1 | Several presentation files remain large. |
| P2 | Runtime custom palette needs measured contrast verification. |
| P2 | Dialog focus trap/return needs browser QA. |
| P2 | Permission matrix keyboard behavior needs browser QA. |
| P2 | Long text and long currency need screenshot QA. |
| P3 | Tooltip, Popover and Toast shared primitives remain future scope. |

## Deferred Items

- Browser screenshot matrix.
- Manual tablet Runtime rehearsal.
- E2E coverage for Schedule, Runtime, Finance and Inventory.
- Automated accessibility and contrast checks.
- Fixture-backed finance and inventory regression data.
- Runtime interaction profiling.
- Optional presentation-only file decomposition for large components.

## Rollback Considerations

- Roll back Stage 12 presentation changes by reverting presentation-layer files and Stage 12 docs together.
- Do not touch database, Prisma schema, repositories, services, API routes, runtime store or protected calculations during rollback.
- If a Runtime operator issue appears, first rollback only Runtime presentation files touched in Stage 12 and preserve store/API behavior.
- If a visual token issue appears, rollback shared token/component presentation changes before touching module-specific UI.

## Production Recommendation

Recommendation: **READY WITH NOTES**.

Badmin is suitable for Release Candidate review or controlled pilot use. It should not be declared final production-ready until browser/device QA and automated critical workflow coverage are added or explicitly waived by the owner.

## Final Decision

READY WITH NOTES
