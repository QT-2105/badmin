# Performance Audit

## Build Baseline

Latest available build baseline before the sprint:

| Metric | Baseline |
| --- | ---: |
| Shared First Load JS | 102 kB |
| `/dashboard` First Load JS | 143 kB |
| `/finance` First Load JS | 145 kB |
| `/inventory` First Load JS | 150 kB |
| `/settings` First Load JS | 144 kB |
| `/users` First Load JS | 142 kB |
| `/sessions/[sessionId]/runtime` First Load JS | 195 kB |

## Dependency Audit

| Area | Result |
| --- | --- |
| Heavy chart libraries | None found. |
| Recharts/chart package | None installed. |
| Icon imports | Named `lucide-react` imports; no package-wide namespace import found. |
| Animation library | `framer-motion` used in Runtime components only. |
| Bundle analyzer script | Not present in `package.json`. |
| Dynamic imports | None found in app/components. |

## Render Path Audit

| Area | Finding | Priority | Decision |
| --- | --- | --- | --- |
| Finance transaction table | `transactionColumns` was created inside `FinancePageView` on each render while it does not use props or state. | P1 | Hoist to module-level const. |
| Dashboard recent session table | Columns already module-level const. | P3 | No change. |
| Runtime Zustand subscriptions | Several components subscribe broad store slices. | P1 | Defer; changing selectors requires Runtime regression and should be its own sprint. |
| Formatters | Date/currency formatting is repeated across modules. | P2 | Defer; shared formatter must preserve per-module semantics. |
| Dialog/panel lazy loading | No measured heavy rarely-used panel target selected. | P3 | No change. |

## Optimization Selected

- Hoist `transactionColumns` out of `FinancePageView` in `src/components/finance/finance-presentation.tsx`.

## Not Selected

- No memoization: no confirmed render bottleneck.
- No dynamic import: no measured bundle issue and no analyzer script.
- No Runtime subscription optimization: risk is too high for this sprint and protected runtime behavior must stay unchanged.
