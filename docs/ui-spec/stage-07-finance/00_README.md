# Stage 07 - Finance Operations UX

Status: Planning / Audit

Created: 2026-07-17

## Goal

Improve only the presentation layer of the Thu chi module so finance operations feel consistent with the SaaS UI platform established in Stages 01-06.

Stage 07 covers:

- Finance page frame
- Report period controls
- KPI summary
- Manual transaction form
- Transaction list
- Transaction type/status presentation
- Loading, empty, error, and action feedback states
- Responsive behavior
- Light mode and dark mode
- Accessibility and visual consistency

## Required Documents

- `01_STAGE_SCOPE.md`
- `02_FINANCE_SAFETY_CONTRACT.md`
- `03_CURRENT_FINANCE_AUDIT.md`
- `04_FINANCE_WORKFLOW_BASELINE.md`
- `05_INFORMATION_ARCHITECTURE.md`
- `06_COMPONENT_DEPENDENCY_GRAPH.md`
- `07_VISUAL_SPECIFICATION.md`
- `08_SPRINT_PLAN.md`
- `09_VALIDATION_PROTOCOL.md`
- `10_FINANCE_REGRESSION_CHECKLIST.md`
- `11_STAGE_ACCEPTANCE.md`
- `12_STAGE_COMPLETION_REPORT_TEMPLATE.md`

## Sprint Directories

- `sprint-7.0-audit/`
- `sprint-7.1-layout-filter/`
- `sprint-7.2-kpi-summary/`
- `sprint-7.3-entry-form/`
- `sprint-7.4-transaction-list/`
- `sprint-7.5-detail-actions/`
- `sprint-7.6-feedback-reporting/`
- `sprint-7.7-responsive/`
- `sprint-7.8-accessibility-regression/`
- `sprint-7.9-completion/`

Each sprint contains:

- `00_SCOPE.md`
- `01_CURRENT_AUDIT.md`
- `02_ALLOWED_FILES.md`
- `03_PROTECTED_FILES.md`
- `04_IMPLEMENTATION_PLAN.md`
- `05_ACCEPTANCE_CHECKLIST.md`
- `06_COMPLETION_REPORT.md`

## Absolute Non-Negotiable Constraints

Stage 07 must not change:

- business logic
- finance calculations
- profit calculations
- revenue calculations
- expense calculations
- entry type
- category mapping
- quantity
- unit price
- total amount
- payment method
- payment status
- session relation
- date filtering
- report period
- API
- database
- Prisma
- repository
- service
- business hooks
- React Query query keys
- mutations
- cache behavior
- route
- permission
- validation
- submit payload

## Required Workflow

Before source changes:

1. Audit current Finance source and dependencies.
2. Identify protected logic and protected files.
3. Map current components and data flow.
4. Create sprint plan and per-sprint allowed/protected files.
5. Stop for review.

No source code has been changed in Stage 07 planning.
