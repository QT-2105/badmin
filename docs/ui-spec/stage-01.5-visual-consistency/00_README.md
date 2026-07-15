# Stage 01.5 - Visual Consistency Audit

## Purpose

Stage 01.5 is a bridge between the Stage 01 foundation and future per-screen UI work.

The goal is to audit the presentation layer and identify where the app has not yet adopted the Stage 01 foundation consistently.

This stage does not redesign screens and does not change business behavior.

## Required Reading Order

Read these files in order before doing any Stage 01.5 work:

1. `00_README.md`
2. `01_AUDIT_SCOPE.md`
3. `02_COMPONENT_USAGE_AUDIT.md`
4. `03_DESIGN_SYSTEM_VIOLATIONS.md`
5. `04_SCREEN_CONSISTENCY_MATRIX.md`
6. `05_MIGRATION_PLAN.md`
7. `06_IMPLEMENTATION_TASKS.md`
8. `07_ACCEPTANCE_CHECKLIST.md`
9. `08_COMPLETION_REPORT_TEMPLATE.md`
10. `09_DETAILED_IMPLEMENTATION_PLAN.md`

Also read Stage 01 foundation documents before using this stage:

- `docs/ui-spec/stage-01-foundation/*`
- project governance in `AGENTS.md`, `/docs/*`, and `/rules/*`

## Stage Status

Stage 01 final state: `PASS WITH NOTES`.

Stage 01.5 starts from that state.

## Non-Negotiable Rule

Stage 01.5 is presentation-only.

Do not change:

- business logic
- API routes
- Prisma models
- database schema
- repositories
- services
- business hooks
- Zustand runtime state logic
- permissions
- route names
- runtime scheduling semantics
- finance or inventory calculations

## Stage Output

The first output of this stage must be an audit report and implementation plan.

No source code should be changed before the baseline audit and implementation plan are complete.

## Current Stage 01.5 Status - 2026-07-14

Status: `AUDIT COMPLETE - PASS WITH NOTES`

The baseline audit, component usage audit, design violation list, screen consistency matrix, and implementation plan have been written into this folder.

Source implementation has not started in Stage 01.5.

Current high-risk findings:

- `P0`: session detail and protected runtime have dark-only / hard-coded presentation debt that can affect light-mode parity and focus/contrast.
- `P1`: many screens still use local badges, native controls, custom cards, and hard-coded colors instead of Stage 01 primitives.
- `P2`: radius, shadow, list density, chart colors, and motion polish remain for later cleanup.

Next valid step:

1. Review `08_COMPLETION_REPORT_TEMPLATE.md` current audit report.
2. Review `09_DETAILED_IMPLEMENTATION_PLAN.md`.
3. If implementation is approved later, start with non-runtime safe migrations from `06_IMPLEMENTATION_TASKS.md`.
4. Do not touch protected runtime UI until the owner explicitly approves the runtime migration scope.
