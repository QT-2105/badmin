# Forbidden Refactors

Version: 2026-06-09

Future AI models must not autonomously:

- move runtime scheduling to root navigation
- replace session-scoped players with global users
- introduce a mandatory court catalog table for the current runtime
- replace `court_number` current-state runtime with enterprise court identity
- convert runtime snapshots to event sourcing
- introduce CQRS
- rewrite `badminton-store.ts` for abstraction purity
- remove operator override controls
- remove `JUST_FINISHED`
- make suggestions auto-apply without operator action
- block runtime UI on DB writes
- turn finance into accounting ERP
- turn shuttlecock inventory into warehouse ERP
- introduce large generic admin/settings modules

Permitted cleanup:

- remove verified unused files
- simplify dead UI
- improve validation messages
- improve responsive layout
- fix bugs while preserving lifecycle semantics
- update docs/rules/prompts when implementation changes
