# Sprint 12.7C Runtime Regression Matrix

## Regression Scope

This sprint validates source-level preservation and command validation. Live seeded runtime operation remains deferred unless an explicit browser/data test harness is provided.

| Item | Result | Evidence |
| --- | --- | --- |
| Waiting queue ordering unchanged | PASS | No edits to queue source, sorting, filters or `src/lib/badminton-store.ts`. |
| `PRIORITY` / `WAITING` ordering unchanged | PASS | No edits to status ranking, queue data source or generation logic. |
| `JUST_FINISHED` behavior unchanged | PASS | No edits to lifecycle actions or status transitions. |
| Pairing algorithm unchanged | PASS | No edits to pairing helpers or store actions. |
| Court assignment unchanged | PASS | Existing `applyNextMatch(..., court.id)` calls preserved. |
| Next-match generation unchanged | PASS | Existing `refreshNextMatches` calls preserved. |
| Apply behavior unchanged | PASS | Existing `applyNextMatch` call sites and arguments preserved. |
| Start match unchanged | PASS | Existing `startMatch(court.id)` call preserved. |
| End match unchanged | PASS | Existing `endMatch(court.id)` and history payload sequence preserved. |
| Swap pair unchanged | PASS | Existing `swapPairs(court.id)` call preserved. |
| Status transitions unchanged | PASS | No edits to runtime status values or transition logic. |
| Zustand actions unchanged | PASS | No edits to store file or action signatures. |
| API calls unchanged | PASS | No edits to API, hooks, repositories or services. |
| Workflow order unchanged | PASS | No section movement; presentation files only. |

## Command Validation

- `npm run lint`: PASS
- `npm run typecheck`: PASS
- `npm run build`: PASS
- `npm run guard:no-db-schema-automation`: PASS
- `git diff --check`: PASS
- protected backend/logic diff: PASS

## Deferred

- Live operator regression with seeded session.
- Browser screenshot QA for tablet landscape, tablet portrait and dark runtime surfaces.
- Real tablet touch QA.
