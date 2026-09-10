# Runtime Audit Prompt

```text
Read AGENTS.md, canonical runtime docs, runtime rules, store, scheduler, eligibility helpers, runtime UI, hooks, API, and repositories.

Verify:
- WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> WAITING
- lastFinishedAt is soft metadata with no cooldown lock
- four eligible players are enough for one match; suggestion count maximizes disjoint valid matches up to court_count
- Đã tới eligibility; Host minimum fallback; Trận kế one-shot; End-Game exclusion
- wait protection outranks ordinary late-arrival assistance
- Couple is fixed only in its registered format
- female effective level is one lower internally
- same-format preference and mixed-format fallback
- only exact recent quartet is anti-repeat input
- FIFO preview top-up, Lock auto-boundary, cross-Lock manual edits, and cancel-to-locked-preview
- no duplicate or PLAYING replacement
- action-driven snapshot commits and runtime revision conflicts
- completed/cancelled state is readonly at UI and persistence boundaries
- match history remains lookup-only
- tablet/mobile controls remain usable

Report current implementation separately from known hardening gaps. Do not redesign or mutate DB.
```
