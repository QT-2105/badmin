# Inventory Settings Current Audit

Status: COMPLETED

## Source Findings

| Capability | Current source | Status | Decision |
|---|---|---|---|
| Low-stock threshold | Dashboard repository uses `quantity_ball <= balls_per_tube * 2` | READ_ONLY / hard-coded business display rule | Do not create setting. |
| Preferred stock display | Inventory UI displays existing tube/piece conversions | MISSING as setting | Do not create setting. |
| Default product tube quantity | Product form default `ballsPerTube: 12`; repository fallback `input.ballsPerTube ?? 12` | READ_ONLY / form and repository default, not Settings-backed | Do not convert into setting. |
| Default movement unit | Movement forms use current product `ballsPerTube` and existing form semantics | MISSING as setting | Do not create setting. |
| Inventory display preferences | No persisted preference or Settings handler found | MISSING | Do not create setting. |
| Player image cleanup | Existing maintenance action in Settings | AVAILABLE, but data-cleanup oriented | Covered by Data/maintenance sprint, not stock calculation settings. |
| Auto shuttle usage voucher | Existing finance/session-completion setting | AVAILABLE, finance-adjacent | Covered by Finance Settings sprint. |
| `current_stock` / `quantity_ball` | Inventory repository/database | PROTECTED | Do not expose or edit as setting. |
| `average_cost` / weighted average | Inventory repository calculations | PROTECTED | Do not expose or edit as setting. |
| Movement semantics | Inventory repository/API | PROTECTED | Do not expose or edit as setting. |
| Stock adjustment formula | Inventory repository | PROTECTED | Do not expose or edit as setting. |
| Global forced tube quantity | No safe capability | MISSING / PROTECTED risk | Do not create setting. |

## Conclusion

No AVAILABLE stock/inventory configuration setting exists in the current Settings layer. Existing inventory-related behavior is either protected business logic, per-product data, a local form default, or a maintenance action covered elsewhere.

Implementation decision: documentation-only, no source code changes.
