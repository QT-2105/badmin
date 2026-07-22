# Performance Audit

## Method

Static scan checked:

- large component line counts
- `useMemo` usage
- repeated `map`, `filter`, `sort`, `slice`
- date/currency formatting in render paths
- runtime protected hot paths

No profiler run was performed in this documentation-only step.

## Large Component Report

| File | Lines | Risk |
| --- | ---: | --- |
| `src/components/inventory/inventory-presentation.tsx` | 1047 | P1 maintainability; presentation-only but large. |
| `src/components/users/auth-users-presentation.tsx` | 760 | P1 maintainability; custom editable table and permission matrix. |
| `src/components/schedule/session-detail-client.tsx` | 758 | P1 mixed presentation/state; candidate for future decomposition. |
| `src/components/settings/settings-presentation.tsx` | 727 | P2 maintainability. |
| `src/components/realtime-dashboard.tsx` | 656 | P1 protected runtime; do not refactor without specific baseline. |
| `src/components/finance/finance-presentation.tsx` | 581 | P2 presentation-only. |

## Render Risk Areas

| Area | Risk | Notes |
| --- | --- | --- |
| Runtime dashboard | P1 | Live screen; verify tablet responsiveness with real session data before optimizing. |
| Player database panel | P1 | Sort/filter/totals and editable table inside runtime. Protected workflow. |
| Users custom table | P1 | Wide editable table; keyboard and large-row QA required. |
| Inventory tables/forms | P1 | Large data and long text/currency states require QA. |
| Dashboard chart | P2 | Static chart bars may need viewport visual QA. |

## Optimization Rules

- Do not optimize without a baseline.
- Prefer React DevTools/profiler evidence or measurable slow interaction.
- Keep mutation/query/payload logic in current owners.
- Never change runtime algorithmic behavior for render performance without separate approval.

## Initial Performance Decision

No immediate performance code change is approved by this Stage 12 documentation step.
