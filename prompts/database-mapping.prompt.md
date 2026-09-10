# Database Mapping Prompt

```text
Read AGENTS.md, docs/data-and-operations.md, docs/readiness.md, rules/release-readiness.yaml, prisma/schema.prisma, affected repositories/services/APIs/hooks, and reviewed SQL.

Before any DB-sensitive action, confirm project, branch, database, and role. Development uses an isolated beta Neon target; empty beta data is valid and says nothing about production.

Preserve:
- Play Session and session_players boundaries
- current runtime snapshots by court_number
- explicit runtime revisions and action-driven commits
- movement plus inventory update in one transaction
- non-negative stock
- completion profit including real court/shuttlecock costs
- manual finance without required session_id
- auth users separate from badminton players

Schema inspection and drift comparison are read-only. Never apply generated SQL automatically. Schema changes require owner-approved reviewed SQL, mapping updates, validation, docs/rules/prompts updates, and a target-specific backup/recovery plan.
```
