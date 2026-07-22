# Motion Matrix

## Matrix

| Component/Area | Motion baseline | Reduced motion | Risk |
| --- | --- | --- | --- |
| Button | transition colors/shadow | yes via shared classes | Low |
| StatusBadge | transition colors | yes | Low |
| Surface/Card | transition where interactive | yes | Low |
| FeedbackState | `motion-feedback-in` | yes | Low |
| Skeleton | pulse | yes | Low |
| Dialog | entry animation | yes | Low |
| Drawer | placement entry animation | yes | Low |
| ActionMenu | feedback/menu animation | yes | Low |
| Runtime | minimal operational animation | mostly static | Low |
| Toast | no provider | N/A | Future scope |

## Findings

- Stage 11 standardized most shared motion.
- No business timing should be touched in Stage 12.
- Runtime countdowns, match timers, refresh intervals and retry intervals are not motion and remain protected.

