# Analyze Project Prompt

```text
Read AGENTS.md, docs/README.md, the canonical docs linked there, and rules/*.yaml before analysis.

Treat removed UI stage/sprint records as Git history only. Inspect current source, Prisma schema, manual SQL, package scripts, and environment shape without exposing secrets or mutating data.

Report the real current architecture:
- root navigation: Dashboard, Lịch chơi, Thu chi, Kho cầu, Người dùng, Cài đặt
- permission-guarded application users remain separate from session players
- runtime only at /sessions/[sessionId]/runtime
- optimistic Zustand state plus action-driven current-snapshot persistence
- courts derived from play_sessions.court_count and persisted by court_number
- WAITING -> NEXT_MATCH/PRIORITY -> PLAYING -> WAITING with soft lastFinishedAt
- attendance, Host, Trận kế, End-Game, Couple, wait protection, and exact-quartet semantics
- transactional session completion and movement-backed shuttlecock inventory
- DB-backed operational settings and dedicated payment bank accounts
- beta database isolation from production

Distinguish implemented behavior, governance target, known deviation, and future proposal. Do not implement or mutate DB.
```
