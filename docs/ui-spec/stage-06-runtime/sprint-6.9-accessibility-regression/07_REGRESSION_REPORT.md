# Runtime Regression Report

Sprint: 6.9 Accessibility and Runtime Regression

Regression method:

- Code-level diff review.
- Protected-area diff review.
- Production build validation.
- No live browser automation.
- No live DB mutation test.

## Runtime Regression Checklist

| Item | Result | Evidence |
| --- | --- | --- |
| 1. Session load | PASS WITH NOTES | No route, hook, API, or hydration logic changed. Not browser-tested. |
| 2. Courts load đúng số lượng | PASS | Court list still renders from existing court data; no court count or mapping logic changed. |
| 3. Queue giữ đúng thứ tự | PASS | No queue source, sorting, status rank, or filtering logic changed. |
| 4. Player selection | PASS | Player click handlers preserved; only accessible names and dialog semantics added. |
| 5. Auto pairing | PASS | `refreshSuggestions` and `refreshNextMatches` calls unchanged. |
| 6. Manual pairing | PASS | Replacement selection handlers and draft replacement flow unchanged. |
| 7. Apply match | PASS | Apply handlers and arguments unchanged. |
| 8. Court assignment | PASS | Court assignment calls and target court data unchanged. |
| 9. Start match | PASS | Start match handler and disabled condition unchanged. |
| 10. End match | PASS | End match handler, runtime commit, and match-history payload timing unchanged. |
| 11. Swap pair | PASS | Swap pair handler and condition unchanged. |
| 12. Court clear | PASS | Cancel-ready-court handler and condition unchanged. |
| 13. Player status update | PASS | No status update action or store logic changed. |
| 14. Match history | PASS | History query/filter source unchanged; panel gained dialog/list semantics only. |
| 15. Completed session state | PASS | Readonly/disabled conditions unchanged. |
| 16. Reload/hydration behavior hiện tại | PASS | Hydration hook and runtime session restore logic unchanged. |
| 17. Permission behavior hiện tại | PASS | No permission files, route guards, or auth logic changed. |

## Accessibility Regression Checklist

| Area | Result | Notes |
| --- | --- | --- |
| Accessible names | PASS | Runtime icon/actions now expose descriptive labels. |
| Expanded state | PASS | Queue and replace controls expose expanded state. |
| Selected state | PASS | Suggestion mode, lock, and replacement slot controls expose pressed state. |
| Focus-visible | PASS | Controls touched in this sprint keep or gain visible focus rings. |
| Keyboard navigation | PASS WITH NOTES | No shortcuts added. Browser focus-order pass deferred. |
| Contrast | PASS WITH NOTES | No new low-contrast tone introduced by this sprint. Full contrast audit deferred. |
| Touch target | PASS WITH NOTES | Existing 40px+ targets preserved in core runtime controls. Real device audit deferred. |
| Dialog semantics | PASS | Runtime overlays now expose dialog role and accessible labels. |
| Reduced motion | PASS WITH NOTES | CSS loading animations touched in this sprint support motion reduction; broader Framer animation policy deferred. |

## Protected Diff

No changes detected in:

- `src/lib/badminton-store.ts`
- `src/app/api/**`
- `src/repositories/**`
- `src/services/**`
- `prisma/**`

## Regression Decision

No business regression detected by static review and validation.

Final decision: PASS WITH NOTES
