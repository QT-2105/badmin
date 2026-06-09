# Database Mapping Prompt

Use this prompt when changing Prisma, repositories, API routes, or DB-backed hooks.

```text
Read:
- AGENTS.md
- docs/06-database-constitution.md
- docs/03-runtime-architecture.md
- docs/07-zustand-runtime-rules.md
- rules/runtime-semantics.yaml

Inspect:
- prisma/schema.prisma
- src/types/domain.ts
- src/types/runtime.ts
- src/repositories/*
- src/services/*
- src/app/api/*
- hooks that consume the affected API

Preserve:
- Play Session as runtime/finance scope
- session_players as session-scoped players
- runtime_courts using court_number current-state snapshots
- runtime_matches as current queued/court-bound snapshots
- no required standalone court catalog for current runtime
- shuttlecock movements for every stock change
- no negative shuttlecock stock
- session profit includes court cost and shuttlecock usage cost
- runtime DB commits only on meaningful operator actions

If changing schema, update:
- Prisma model
- migration/manual migration
- repository mapping
- service/API contract
- hook/UI fields
- docs/rules/prompts if semantics changed

Do not introduce event sourcing, CQRS, global players, ERP finance, or warehouse inventory.
```
