# Component Size Report

Command:

```bash
find src/components src/app -name '*.tsx' -print0 | xargs -0 wc -l | sort -nr | head -80
```

## Components Over 600 Lines

| Lines | File | Risk | Recommendation |
| ---: | --- | --- | --- |
| 862 | `src/components/inventory/inventory-page-client.tsx` | High | Presentation-only decomposition into stock metrics, product form, product table, movement forms and history. |
| 728 | `src/components/schedule/session-detail-client.tsx` | High | Presentation-only decomposition around summary, completion, player form and player rows. |
| 665 | `src/components/settings/settings-page-client.tsx` | Medium | Presentation-only decomposition around sections and confirmation dialog state. |
| 633 | `src/components/realtime-dashboard.tsx` | High | Runtime presentation decomposition only with handler preservation table. |
| 623 | `src/components/users/auth-users-panel.tsx` | High | Presentation-only decomposition for create form, user table, role cards, permission matrix. |

## Components Over 400 Lines

| Lines | File | Risk | Recommendation |
| ---: | --- | --- | --- |
| 412 | `src/components/finance/finance-page-client.tsx` | Medium | Presentation-only decomposition for KPI, form and transaction list. |

## Components Over 300 Lines

| Lines | File | Risk | Recommendation |
| ---: | --- | --- | --- |
| 382 | `src/components/sections/player-database-panel.tsx` | High | Runtime presentation-only decomposition, no sorting/edit behavior changes. |
| 353 | `src/components/dashboard/dashboard-page-client.tsx` | Medium | Optional decomposition for chart/alerts/cost breakdown. |
| 325 | `src/components/cards/next-match-card.tsx` | High | Avoid unless necessary; next-match behavior is protected. |

## Decomposition Rule

Any decomposition must preserve:

- props
- callbacks
- handler arguments
- data ordering
- validation ownership
- submit payloads
- query and mutation behavior

No decomposition may introduce business logic into shared UI components.

