# Implementation Plan

Status: Complete for Sprint 6.0.

Sprint 6.0 establishes the runtime UX safety baseline. It does not implement UI changes.

## Task Steps

1. Read sprint scope and Stage 06 safety contract.
2. Audit current runtime components and identify presentation responsibilities.
3. List allowed documentation files.
4. List protected source files and runtime contracts.
5. Record handler and data-contract dependencies that later sprints must preserve.
6. Confirm only presentation-layer work is allowed for future implementation sprints.
7. Run validation commands:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
8. Check protected diff.
9. Update Sprint 6.0 completion report.
10. Stop.

## Handler/Data Contract Rules For Later Sprints

- Keep existing callback names, arguments, call timing, and async flow.
- Keep data shape passed into `CourtCard`, `NextMatchCard`, `PlayerDatabasePanel`, and `MatchHistoryPanel`.
- Do not derive new queue or match data in presentation components.
- Do not move persistence into render effects.
- Do not add polling, automatic writes, or realtime DB select loops.
- If a visual change requires any protected behavior change, record it as out of scope and stop that task.

## Validation Checkpoint

Sprint 6.0 is complete only when docs are updated, validation commands pass, and protected source diff is clean.
