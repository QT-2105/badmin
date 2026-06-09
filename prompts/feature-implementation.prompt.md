# Feature Implementation Prompt

Use this prompt before implementing a feature in Badmin.

```text
Read AGENTS.md, /docs/*, and /rules/* first.

Implement incrementally.

Preserve:
- root navigation: Dashboard, Lịch chơi, Thu chi, Kho cầu, Cài đặt
- runtime only at /sessions/[sessionId]/runtime
- session-scoped players
- Zustand optimistic runtime behavior
- current-state DB recovery
- explicit runtime snapshot commits on important actions
- operator-first scheduling
- tablet/mobile-first runtime layout
- lightweight finance and shuttlecock inventory

Before editing, decide if the change touches protected areas:
- src/lib/badminton-store.ts
- runtime status lifecycle
- next-match scoring or replacement
- court lifecycle
- JUST_FINISHED
- runtime sync/hydration
- session completion
- shuttlecock inventory movements
- app shell navigation

If protected semantics change and the owner did not explicitly ask for it, stop and ask.

Use the existing shape:
- UI -> hook -> service -> API -> repository -> Prisma
- Zustand for live runtime actions
- Prisma transactions for completion and inventory movements

After implementation, run lint/typecheck/build where practical.
```
