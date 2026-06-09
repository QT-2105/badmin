# AI Governance Rules

Version: 2026-06-09

## Required Reading

Before architecture-sensitive changes, AI must read:

1. `AGENTS.md`
2. `/docs/*`
3. `/rules/*`
4. relevant source files
5. `prisma/schema.prisma` when DB behavior is involved

## Current Source Of Truth

Governance must describe the current implementation. If project behavior changes, update docs/rules/prompts in the same work.

## Must Preserve

- session-centric architecture
- current-state runtime persistence
- operator-first scheduling
- explicit DB commits for runtime
- `JUST_FINISHED` cooldown semantics
- tablet/mobile runtime ergonomics
- lightweight finance and inventory
- Play Session as the runtime boundary

## Must Not Introduce

- global players or members
- event sourcing
- CQRS
- ERP/accounting architecture
- warehouse inventory complexity
- runtime as root navigation
- mandatory auto-scheduling
- continuous DB writes for temporary runtime UI state

## Escalate Before

Ask the owner before changing:

- scheduling lifecycle
- queue eligibility
- next-match scoring priorities
- court lifecycle
- runtime persistence strategy
- session-scoped player model
- session completion finance semantics
- shuttlecock inventory movement semantics
- app navigation hierarchy
