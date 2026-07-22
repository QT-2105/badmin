# Presentation Logic Risk Map

## Risk Categories

| Risk | Examples found | Severity | Stage 12 rule |
| --- | --- | --- | --- |
| Inline formatter repetition | `toLocaleString`, date formatting in Finance, Users, Match History, player fee input | P2 | May centralize only if no formatting semantics change. |
| Duplicate status mapping | role/status tones, transaction badges, movement badges, session status badges | P2 | Can consolidate only within presentation scope. |
| Local color mapping | Dashboard chart tones, Runtime stat pills, player tags | P2/P1 | Do not change semantic mapping without visual issue. |
| Derived state in state | form open states, expanded sections, draft maps | P2 | Leave unless confirmed stale/buggy. |
| Inline arrays/objects | DataTable state/columns in presentation files | P2 | Avoid premature memoization unless measured. |
| Heavy protected runtime UI | Runtime dashboard, next-match card, player panel | P1 | Presentation-only changes require tight allowed-file scope and runtime regression. |
| Business-adjacent presentation | Finance totals, Inventory stock display, session completion summary | P1 | Do not move calculations into shared components. |

## Safe Optimization Candidates

- Extract repeated display-only badge helpers within the same module.
- Keep `formatCurrency` use from existing helper where already available.
- Avoid adding `useMemo` or `useCallback` unless a measured render problem exists.
- Prefer data passed from parent to presentation components.

## Out of Scope

- moving finance or inventory calculations into shared UI
- changing runtime queue/status/pairing derivation
- changing sorting/filtering/pagination
- changing query/mutation payload ownership

