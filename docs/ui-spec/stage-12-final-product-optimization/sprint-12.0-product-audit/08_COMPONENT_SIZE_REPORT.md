# Component Size Report

Static command:

```bash
find src/components src/app -name '*.tsx' -print0 | xargs -0 wc -l | sort -nr | head -80
```

## Components Over 700 Lines

| File | Lines | Risk |
| --- | ---: | --- |
| `src/components/inventory/inventory-presentation.tsx` | 1047 | High presentation maintainability risk. |
| `src/components/users/auth-users-presentation.tsx` | 760 | Medium-high presentation maintainability risk. |
| `src/components/schedule/session-detail-client.tsx` | 758 | Medium-high mixed orchestration/presentation risk. |
| `src/components/settings/settings-presentation.tsx` | 727 | Medium-high presentation maintainability risk. |

## Components Over 500 Lines

| File | Lines | Risk |
| --- | ---: | --- |
| `src/components/realtime-dashboard.tsx` | 656 | Runtime protected presentation; high care required. |
| `src/components/finance/finance-presentation.tsx` | 581 | Medium presentation maintainability risk. |

## Components Over 300 Lines

| File | Lines | Risk |
| --- | ---: | --- |
| `src/components/dashboard/dashboard-page-client.tsx` | 403 | Medium; dashboard still combines chart/list presentation. |
| `src/components/sections/player-database-panel.tsx` | 382 | Runtime protected panel. |
| `src/components/inventory/inventory-page-client.tsx` | 364 | Orchestration parent; acceptable but monitor. |
| `src/components/cards/next-match-card.tsx` | 325 | Runtime protected card; avoid broad refactor. |
| `src/components/ui/page-layout.tsx` | 318 | Shared UI file; only optional props or small cleanup. |
| `src/components/schedule/play-date-detail-client.tsx` | 307 | Schedule detail presentation/orchestration mix. |

## Interpretation

- Stage 11 reduced parent orchestration files but introduced large presentation files.
- These large presentation files are acceptable for RC if behavior remains stable.
- Stage 12 should not split files unless there is clear presentation maintainability benefit and no logic movement.

