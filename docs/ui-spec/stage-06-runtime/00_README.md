# Stage 06 - Runtime Operations UX

Status: Planning / Audit

Created: 2026-07-16

## Goal

Improve only the presentation layer of the Runtime Operations screen while preserving protected runtime semantics.

Stage 06 covers:

- Runtime page frame
- Header and control bar
- Court area
- Court Card
- Người đang chờ
- Trận tiếp theo
- Lịch sử trận
- Responsive behavior, with tablet-first priority
- Accessibility and visual consistency

## Required Documents

- `01_STAGE_SCOPE.md`
- `02_RUNTIME_SAFETY_CONTRACT.md`
- `03_CURRENT_RUNTIME_AUDIT.md`
- `04_RUNTIME_WORKFLOW_BASELINE.md`
- `05_COMPONENT_DEPENDENCY_GRAPH.md`
- `06_PROTECTED_LOGIC_AND_FILES.md`
- `07_VISUAL_SPECIFICATION.md`
- `08_SPRINT_PLAN.md`
- `09_VALIDATION_PROTOCOL.md`
- `10_REGRESSION_CHECKLIST.md`
- `11_STAGE_ACCEPTANCE.md`
- `12_STAGE_COMPLETION_REPORT_TEMPLATE.md`

## Sprint Directories

- `sprint-6.0-audit/`
- `sprint-6.1-layout/`
- `sprint-6.2-header/`
- `sprint-6.3-court-grid/`
- `sprint-6.4-court-card/`
- `sprint-6.5-waiting-queue/`
- `sprint-6.6-next-match/`
- `sprint-6.7-match-history/`
- `sprint-6.8-tablet-responsive/`
- `sprint-6.9-accessibility-regression/`
- `sprint-6.10-stage-completion/`

Each sprint contains:

- `00_SCOPE.md`
- `01_CURRENT_AUDIT.md`
- `02_ALLOWED_FILES.md`
- `03_PROTECTED_FILES.md`
- `04_IMPLEMENTATION_PLAN.md`
- `05_ACCEPTANCE_CHECKLIST.md`
- `06_COMPLETION_REPORT.md`

## Absolute Non-Negotiable Constraints

Stage 06 must not change:

- thuật toán xếp cặp
- thứ tự hàng chờ
- runtime status
- player status
- court assignment
- match assignment
- start/end match
- swap pair
- apply match
- Zustand store
- React Query
- API
- repository
- service
- database
- Prisma
- finance
- inventory
- permission

## Required Workflow

Before code changes:

1. Audit Runtime source and dependencies.
2. Map every visual change to an existing UI responsibility.
3. Identify every handler/selector/store call that must remain unchanged.
4. Create a task-level implementation plan.
5. Confirm protected diff baseline.

Do not implement until the plan is complete.

## Current State

This stage is documentation and audit only. Source code has not been changed.

Implementation starts only after sprint 6.0 audit is reviewed and accepted.
