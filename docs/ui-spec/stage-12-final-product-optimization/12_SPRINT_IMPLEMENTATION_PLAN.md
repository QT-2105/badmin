# Stage 12 Sprint Implementation Plan

## Status

PLANNED — REVIEW REQUIRED

Do not start Sprint 12.1 until this plan is accepted.

## Sprint 12.0 — Audit and RC Baseline

Status: COMPLETED — DOCUMENTATION ONLY

Report:

- `sprint-12.0-product-audit/17_COMPLETION_REPORT.md`

Allowed files:

- `docs/ui-spec/stage-12-final-product-optimization/**`
- `docs/ui-spec/PROJECT_PROGRESS.md`

Tasks:

- complete Stage 12 product audit
- confirm safety contract
- confirm protected logic map
- confirm regression map
- define RC acceptance criteria

Validation:

- `git diff --check`
- protected backend/logic diff command

Completion:

- documentation complete
- no source code changed

## Sprint 12.1 — Color System Optimization

Status: COMPLETED

Report:

- `sprint-12.1-color-system-optimization/06_COMPLETION_REPORT.md`

Allowed files:

- `sprint-12.1-color-system-optimization/02_ALLOWED_FILES.md`

Candidate areas:

- light/dark token hierarchy
- background/surface/elevated surface parity
- text and muted text readability
- border/input hierarchy
- semantic foreground contrast
- shared feedback/status/KPI tone consistency

Not allowed:

- runtime workflow changes
- global redesign
- business logic changes

Validation:

- lint
- typecheck
- build
- DB schema guard
- protected diff
- viewport QA notes

## Sprint 12.2 — Color and Contrast Polish

Status: COMPLETED

Report:

- `sprint-12.2-typography-border-surface-elevation/06_COMPLETION_REPORT.md`

Candidate areas:

- typography hierarchy
- KPI value and label scale
- border and surface hierarchy
- shadow/elevation levels
- radius consistency
- dense table divider weight

Runtime rule:

- do not normalize Runtime palette unless a specific contrast/visual issue is confirmed.

## Sprint 12.3 — KPI and Data Presentation Polish

Status: COMPLETED

Report:

- `sprint-12.3-kpi-stat-card-optimization/06_COMPLETION_REPORT.md`

Candidate areas:

- Dashboard KPI/chart relationship
- Finance KPI long values
- Inventory KPI density
- Session summary stat consistency

Protected:

- KPI values and calculations
- data source
- formatting semantics

## Sprint 12.4 — Layout Density and Visual Hierarchy

Status: COMPLETED

Report:

- `sprint-12.4-layout-density-visual-hierarchy/06_COMPLETION_REPORT.md`

Candidate areas:

- page hierarchy
- module-specific density
- finance/inventory operational density
- settings navigation density
- section/card spacing

Protected:

- runtime workflow
- business logic
- data source/query/mutation/payload behavior

## Sprint 12.5 — Shared Component Final Polish

Status: COMPLETED

Report:

- `sprint-12.5-shared-component-final-polish/06_COMPLETION_REPORT.md`

Candidate areas:

- Button, IconButton, Surface/Card
- StatCard and StatusBadge
- Dialog, ConfirmationDialog and Drawer
- DataTable, FilterBar and FormSection
- Feedback, Skeleton, EmptyState and ErrorState
- missing Toast/Tooltip/Popover audit

Protected:

- default handler contracts
- event semantics
- business logic
- permission logic
- store/module state

## Sprint 12.6 — Interaction, Motion and Feedback Polish

Status: COMPLETED

Report:

- `sprint-12.6-interaction-motion-polish/06_COMPLETION_REPORT.md`

Candidate areas:

- hover/pressed/focus consistency
- loading/skeleton polish
- error/retry consistency
- reduced-motion verification

Protected:

- business timing
- runtime timers
- retry intervals
- mutation behavior

## Sprint 12.7A — App Shell and Dashboard Final Polish

Status: COMPLETED

Report:

- `sprint-12.7a-app-shell-dashboard-final-polish/06_COMPLETION_REPORT.md`

Allowed files:

- `sprint-12.7a-app-shell-dashboard-final-polish/02_ALLOWED_FILES.md`

Candidate areas:

- App Shell sidebar/header surface hierarchy
- App Shell active navigation state
- App Shell collapse and mobile navigation affordance
- Dashboard KPI/status/card presentation
- Dashboard chart visual noise reduction

Protected:

- routes
- permission visibility
- menu configuration
- redirect behavior
- Dashboard query and calculations
- Dashboard chart data and recent-session links

## Sprint 12.7B — Schedule and Session Workspace Final Polish

Status: COMPLETED

Report:

- `sprint-12.7b-schedule-session-workspace-final-polish/06_COMPLETION_REPORT.md`

Allowed files:

- `sprint-12.7b-schedule-session-workspace-final-polish/02_ALLOWED_FILES.md`

Candidate areas:

- Schedule list and expanded-session accessibility semantics
- Play Date detail session-list polish
- Session Workspace header action wrapping
- Session Workspace completion and player-list scanability

Protected:

- Play date CRUD
- Session CRUD
- Player CRUD
- Session completion validation and payloads
- Finance/inventory calculation behavior
- Runtime route/workflow
- hooks, queries, mutations, services, repositories, API, database, Prisma, routes and permissions

## Sprint 12.7C — Runtime Final UX Polish

Status: COMPLETED

Report:

- `sprint-12.7c-runtime-final-ux-polish/06_COMPLETION_REPORT.md`

Allowed files:

- `sprint-12.7c-runtime-final-ux-polish/02_ALLOWED_FILES.md`

Candidate areas:

- Court Card readability
- player name and gender differentiation
- next-match card density and touch targets
- empty court and playing state presentation
- reduced visual noise

Protected:

- waiting queue ordering
- `PRIORITY` / `WAITING` ordering
- `JUST_FINISHED` behavior
- pairing algorithm
- court assignment
- next-match generation
- apply/start/end/swap behavior
- status transitions
- Zustand actions and API calls

## Sprint 12.7D — Finance Final UX Polish

Status: COMPLETED

Report:

- `sprint-12.7d-finance-final-ux-polish/06_COMPLETION_REPORT.md`

Allowed files:

- `sprint-12.7d-finance-final-ux-polish/02_ALLOWED_FILES.md`

Candidate areas:

- revenue, expense and profit hierarchy
- positive/negative semantic colors
- currency readability
- table density and mobile card readability
- form/filter/empty/warning presentation audit

Protected:

- revenue formula
- expense formula
- profit formula
- category semantics
- session relation
- payment status and payment method
- API, mutation and payload behavior

## Sprint 12.7E — Inventory Final UX Polish

Status: COMPLETED

Report:

- `sprint-12.7e-inventory-final-ux-polish/06_COMPLETION_REPORT.md`

Allowed files:

- `sprint-12.7e-inventory-final-ux-polish/02_ALLOWED_FILES.md`

Candidate areas:

- product summary and stock quantity presentation
- tube/piece display readability
- low-stock and out-of-stock badges
- average cost display readability
- movement table and movement type badges
- forms/dialogs/table density/mobile-tablet presentation audit

Protected:

- `current_stock`
- `average_cost`
- movement calculation
- tube-to-piece conversion
- movement type semantics
- API, mutation, payload and validation behavior

## Sprint 12.7F — Users Final UX Polish

Status: COMPLETED

Report:

- `sprint-12.7f-users-final-ux-polish/06_COMPLETION_REPORT.md`

Allowed files:

- `sprint-12.7f-users-final-ux-polish/02_ALLOWED_FILES.md`

Candidate areas:

- user list readability and dense inline-edit presentation
- role badge and role summary presentation
- account status badge and helper text clarity
- permission matrix selected/read-only/focus presentation
- long username and display-name handling
- tablet/mobile smoke presentation audit

Protected:

- authentication provider
- session, token and cookie behavior
- user IDs, email identity and password behavior
- role codes and permission keys/codes
- user-role and role-permission mappings
- account status values and transitions
- authorization checks, middleware and route guards
- API, query keys, mutations, cache invalidation, payload and validation behavior

## Sprint 12.7G — Settings Final UX Polish

Status: COMPLETED

Report:

- `sprint-12.7g-settings-final-ux-polish/06_COMPLETION_REPORT.md`

Allowed files:

- `sprint-12.7g-settings-final-ux-polish/02_ALLOWED_FILES.md`

Candidate areas:

- Settings navigation readability and existing capability status presentation
- branding dirty/save/error feedback presentation
- finance local-preference toggle readability and focus state
- max-court settings presentation
- destructive action result and confirmation presentation
- tablet/mobile smoke presentation audit

Protected:

- configuration keys and value semantics
- default values and persistence mechanisms
- branding payloads and logo upload/delete behavior
- local setting write behavior
- destructive reset service calls
- API, query keys, mutations, cache invalidation, validation and payload behavior
- permissions, routes and server authorization
- runtime algorithms, finance calculations and inventory calculations

## Sprint 12.7 — Responsive and Device QA Pass

Candidate areas:

- browser screenshot QA
- tablet QA
- mobile QA
- overflow verification
- dialog/drawer viewport fit

No new test infrastructure unless approved.

## Sprint 12.8 — Presentation Logic Optimization

Status: COMPLETED

Report:

- `sprint-12.8-presentation-logic-optimization/06_COMPLETION_REPORT.md`

Candidate areas:

- measure before changing
- reduce confirmed unnecessary rerenders
- split presentation-only helpers only when useful
- extract pure formatter or UI-only mapping only when duplication is confirmed
- process one module at a time

Completed scope:

- Settings presentation logic optimization
- extracted local presentation-only helpers: `CapabilityStatusChip`, `SaveStatePill`, `SettingsFeedbackMessage`
- preserved Settings parent state, handlers, query/mutation ownership and config contracts

Protected:

- no runtime algorithm changes
- no payload/query/mutation changes
- no business logic in shared components

## Sprint 12.9 — Measured Frontend Performance Optimization

Status: COMPLETED

Report:

- `sprint-12.9-measured-frontend-performance-optimization/06_COMPLETION_REPORT.md`

Completed scope:

- audited current dependencies, route bundle sizes, heavy libraries and dynamic imports
- confirmed no bundle analyzer script exists
- confirmed no chart library is installed
- hoisted Finance transaction table columns to module scope to avoid repeated render allocation

Protected:

- no query key changes
- no mutation changes
- no cache strategy changes
- no data-fetching behavior changes
- no sort/filter/pagination changes
- no finance calculation changes
- no runtime state architecture changes

## Sprint 12.10 — Final Responsive and Accessibility QA

Status: COMPLETED

Report:

- `sprint-12.10-final-responsive-accessibility-qa/06_COMPLETION_REPORT.md`

Candidate areas:

- requested viewport matrix
- page-level overflow
- header/toolbar wrapping
- table/form/dialog/drawer viewport behavior
- keyboard traversal
- focus return
- heading hierarchy
- form associations
- status text not color-only
- dialog/drawer semantics

Completed scope:

- static responsive source scan
- static accessibility source scan
- final accessibility report
- validation with existing commands

## Sprint 12.11 — Full Business Regression

Status: COMPLETED

Report:

- `sprint-12.11-full-business-regression/05_COMPLETION_REPORT.md`

Candidate areas:

- all modules
- all critical workflows
- validation commands
- protected diff
- deferred issue status

Completed scope:

- Schedule static business regression matrix
- Runtime static business regression matrix
- Finance static business regression matrix
- Inventory static business regression matrix
- Users and Settings static regression matrix
- existing test discovery
- validation commands

## Sprint 12.12 — Final Product and Architecture Audit

Status: COMPLETED

Report:

- `sprint-12.12-final-product-architecture-audit/01_FINAL_PRODUCT_ARCHITECTURE_AUDIT.md`
- `sprint-12.12-final-product-architecture-audit/02_COMPLETION_REPORT.md`

Tasks:

- final product scorecard
- module-level review
- architecture assessment
- design system, color, KPI, typography, responsive, accessibility, interaction, performance and maintainability assessment
- business regression result
- top strengths and remaining issues
- technical debt, known limitations, deferred improvements and production risks
- release recommendation

Completed scope:

- evaluated all requested scoring categories with evidence, strength, weakness and remaining risk
- reviewed App Shell, Dashboard, Schedule, Session Workspace, Runtime, Finance, Inventory, Users and Settings
- classified remaining issues as P0, P1, P2, P3 and Future
- recorded release recommendation as Release Candidate eligible with notes

Final decisions:

- PASS
- PASS WITH NOTES
- FAIL
- BLOCKED

## Sprint 12.13 — Release Candidate and Stage Completion

Status: COMPLETED

Reports:

- `14_RELEASE_CANDIDATE_REPORT.md`
- `15_STAGE_COMPLETION_REPORT.md`

Tasks:

- release candidate identifier
- branch and commit assessment
- environment record
- validation command results
- module readiness
- responsive, accessibility and design readiness
- runtime, finance and inventory regression summary
- known issues, deferred items and rollback considerations
- Stage 12 completion report
- final project scores
- release recommendation

Completed scope:

- created RC report
- created Stage completion report
- recorded mandatory protected-logic confirmations
- recorded final decision as READY WITH NOTES

Final decisions:

- READY FOR RELEASE
- READY WITH NOTES
- NOT READY
- BLOCKED
