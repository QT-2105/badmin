# Top 30 Issues

1. Browser screenshot QA is still missing for Stage 12 RC viewports.
2. Real tablet QA is still missing, especially Runtime.
3. Real mobile QA is still missing for non-runtime modules.
4. No E2E/browser test infrastructure exists.
5. `inventory-presentation.tsx` is 1047 lines.
6. `auth-users-presentation.tsx` is 760 lines.
7. `session-detail-client.tsx` is 758 lines.
8. `settings-presentation.tsx` is 727 lines.
9. `realtime-dashboard.tsx` is 656 lines and protected.
10. `finance-presentation.tsx` is 581 lines.
11. Runtime uses many direct slate/cyan/emerald/amber classes.
12. Runtime custom palette may need contrast review.
13. Dashboard chart color mapping is local.
14. Runtime `StatPill` differs from shared KPI cards.
15. Inventory summary has many equally prominent KPI cards on wide screens.
16. Users custom table cannot yet use `DataTable` because of inline edit semantics.
17. Permission matrix needs browser keyboard QA.
18. Settings navigation needs real tablet/mobile QA.
19. Long currency and long labels need screenshot verification.
20. Dialog/drawer stacking needs browser QA.
21. Toast remains missing/future scope.
22. Tooltip/popover primitives are not broadly formalized.
23. Inline date formatting appears in multiple presentation files.
24. Inline status/role mapping appears in multiple modules.
25. Inline local DataTable column arrays may recreate render objects.
26. Some `useMemo` usage is defensive rather than measured.
27. Protected runtime presentation limits broad visual normalization.
28. Browser contrast tooling has not been run.
29. There is no performance profiling baseline.
30. Stage 12 implementation must avoid over-polishing into redesign.

