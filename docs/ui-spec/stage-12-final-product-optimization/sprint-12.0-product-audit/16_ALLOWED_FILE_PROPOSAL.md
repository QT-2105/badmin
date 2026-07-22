# Allowed File Proposal by Sprint

These are proposals only. Each implementation sprint must confirm its allowed files before code.

## Sprint 12.1 — Visual System Polish

Candidate allowed files:

- `src/app/globals.css`
- `src/components/ui/page-layout.tsx`
- `src/components/ui/surface.tsx`
- `src/components/ui/stat-card.tsx`
- `src/components/dashboard/dashboard-page-client.tsx`
- `src/components/finance/finance-presentation.tsx`
- `src/components/inventory/inventory-presentation.tsx`
- `src/components/settings/settings-presentation.tsx`

Protected caution:

- Runtime files excluded unless a specific approved contrast issue exists.

## Sprint 12.2 — Color and Contrast Polish

Candidate allowed files:

- `src/app/globals.css`
- `src/components/ui/status-badge.tsx`
- `src/components/ui/button.tsx`
- `src/components/ui/feedback.tsx`
- `src/components/ui/stat-card.tsx`
- module presentation files only as needed for confirmed contrast issues

## Sprint 12.3 — KPI and Data Presentation Polish

Candidate allowed files:

- `src/components/ui/stat-card.tsx`
- `src/components/dashboard/dashboard-page-client.tsx`
- `src/components/finance/finance-presentation.tsx`
- `src/components/inventory/inventory-presentation.tsx`
- `src/components/schedule/session-detail-client.tsx`

## Sprint 12.4 — Interaction, Motion and Feedback Polish

Candidate allowed files:

- `src/app/globals.css`
- `src/components/ui/button.tsx`
- `src/components/ui/action-menu.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/feedback.tsx`
- `src/components/ui/form.tsx`

## Sprint 12.5 — Responsive and Device QA Pass

Candidate allowed files:

- `src/components/app-shell.tsx`
- `src/components/ui/page-layout.tsx`
- `src/components/ui/data-table.tsx`
- `src/components/dashboard/dashboard-page-client.tsx`
- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`
- `src/components/schedule/session-detail-client.tsx`
- `src/components/finance/finance-presentation.tsx`
- `src/components/inventory/inventory-presentation.tsx`
- `src/components/users/auth-users-presentation.tsx`
- `src/components/settings/settings-presentation.tsx`

## Sprint 12.6 — Accessibility RC Pass

Candidate allowed files:

- shared UI primitives
- `src/components/app-shell.tsx`
- module presentation files with confirmed accessibility issues

## Sprint 12.7 — Render Performance and Presentation Logic RC Pass

Candidate allowed files:

- module presentation files only after baseline measurement
- no protected logic files
- no hooks/repositories/services/API/Prisma

## Sprint 12.8 — Full Product Regression

Candidate allowed files:

- documentation only by default
- source fixes only if a confirmed UI regression is inside an approved allowed-file set

## Sprint 12.9 — Project Acceptance Report

Allowed files:

- `docs/ui-spec/stage-12-final-product-optimization/**`
- `docs/ui-spec/PROJECT_PROGRESS.md`

## Always Protected

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

