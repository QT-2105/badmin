# Stage 01.5 Implementation Tasks

## Task 0 - Baseline Audit

Run and record:

- `git status --short`
- `git diff --name-only`
- hard-coded presentation class scan
- shared component usage scan
- protected-area diff check

Do not edit code during Task 0.

## Task 1 - Component Usage Audit

Map current screen/component usage against Stage 01 primitives.

Output:

- file-by-file usage audit
- safe migrations
- caution migrations
- deferred migrations

## Task 2 - Design System Violation Audit

Identify violations in:

- tokens
- typography
- spacing
- radius
- border
- shadow
- buttons
- inputs
- badges
- cards
- loading/empty states
- light/dark mode

## Task 3 - Screen Consistency Matrix

Complete the matrix from `04_SCREEN_CONSISTENCY_MATRIX.md`.

No source code changes.

## Task 4 - Implementation Plan

Create a safe sequence for implementation.

The plan must:

- start with low-risk shared components
- avoid protected runtime changes until later
- preserve business behavior
- specify validation after each group

## Task 5 - Safe Token Migration

Only after Tasks 0-4 are complete.

Allowed:

- safe presentation-only class replacements
- token adoption
- shared primitive adoption where behavior is unchanged

## Task 6 - Non-Runtime Screen Consistency

Normalize low-risk screens first.

Do not change workflows.

## Task 7 - Protected Runtime Review

Audit only by default.

Implementation requires explicit approval if changes affect protected runtime files.

## Task 8 - Validation

Run:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run guard:no-db-schema-automation`

## Task 9 - Completion Report

Use `08_COMPLETION_REPORT_TEMPLATE.md`.

Final status must be one of:

- `PASS`
- `PASS WITH NOTES`
- `BLOCKED`

## Audit Result Task List - 2026-07-14

The following tasks are derived from the completed audit. They are not yet implemented.

### P0 Tasks

| ID | Area | Task | Risk | Guardrail |
|---|---|---|---|---|
| P0-01 | Session detail | Replace dark-only hard-coded surfaces, overlays, and modal styles with semantic tokens. | CAUTION | Do not change session lifecycle, player CRUD payloads, payment semantics, completion math, or navigation. |
| P0-02 | Runtime protected UI | Prepare a runtime token-only migration proposal for court cards, next-match cards, queue/player tags, and overlays. | PROTECTED | Requires explicit owner approval before source changes. |
| P0-03 | Player quick view | Normalize player info modal contrast, size, overflow, and focus behavior with shared surface/modal styles. | CAUTION | Keep click-to-open, click-outside/close, and displayed player fields unchanged. |

### P1 Tasks

| ID | Area | Task | Risk | Guardrail |
|---|---|---|---|---|
| P1-01 | Shared visual semantics | Define reusable domain badge tone wrappers for finance, inventory, schedule, users, and runtime tags. | SAFE_MIGRATION | Labels and enum mappings must not change. |
| P1-02 | Dashboard | Tokenize chart series colors and legend colors. | SAFE_MIGRATION | Keep dashboard data and calculations unchanged. |
| P1-03 | Finance | Replace `TransactionBadge` local styles with semantic badge wrapper; normalize list headers and filters. | SAFE_MIGRATION | Do not alter adjustment/revenue/expense calculations. |
| P1-04 | Inventory | Replace `MovementBadge` local styles with semantic badge wrapper; normalize movement list headers and import/export tabs. | SAFE_MIGRATION | Do not alter stock movement or no-negative-stock rules. |
| P1-05 | Schedule | Normalize play-date cards, tags, expand controls, and action naming visually. | SAFE_MIGRATION | Do not change date/session CRUD rules. |
| P1-06 | Play date detail | Replace manual page heading and create-session panel with `PageHeader`/`SectionCard` patterns. | SAFE_MIGRATION | Do not change court limit validation or session CRUD rules. |
| P1-07 | Users | Migrate native inputs/selects/checkboxes and custom save buttons to shared primitives. | SAFE_MIGRATION | Do not change permission keys, roles, auth mutations, or login behavior. |
| P1-08 | Settings | Normalize custom settings cards, upload/delete/reset buttons, and danger/warning messages. | SAFE_MIGRATION | Do not change S3 deletion, branding upload, local settings, or reset operations. |
| P1-09 | Loading/empty states | Map ad hoc empty/loading/error text to `NoticeCard`, `EmptyState`, or `Skeleton` where safe. | SAFE_MIGRATION | Do not hide required operational warnings. |

### P2 Tasks

| ID | Area | Task | Risk | Guardrail |
|---|---|---|---|---|
| P2-01 | Radius/shadow | Replace isolated `rounded-2xl`, `shadow-2xl`, and arbitrary shadow/radius patterns where they clash with Stage 01 scale. | SAFE_MIGRATION | Preserve touch target size. |
| P2-02 | Typography polish | Normalize decorative uppercase microcopy and section labels that compete with content. | SAFE_MIGRATION | Preserve operational labels and Vietnamese wording. |
| P2-03 | Table/list density | Create a consistent list/table visual pattern for finance, inventory, users, and recent session lists. | SAFE_MIGRATION | Preserve row actions and pagination behavior. |
| P2-04 | Motion polish | Review hover/scale effects in dense operational areas. | CAUTION | Do not change interaction timing or touch behavior. |

### Suggested Implementation Sequence

1. `P1-01`
2. `P1-02`
3. `P1-03`
4. `P1-04`
5. `P1-07`
6. `P1-08`
7. `P1-05`
8. `P1-06`
9. `P0-01`
10. `P0-03`
11. `P0-02` only after explicit owner approval
12. P2 polish tasks after P0/P1 consistency is stable
