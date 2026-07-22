# Sprint 11.1 Implementation Plan

1. Create allowed/protected files for `sprint-11.1-layout-hardening`.
2. Update `PageShell` to prevent page-level horizontal scroll by default and enforce `min-w-0` containment.
3. Update app shell root/main containment without changing navigation, auth or permissions.
4. Remove Dashboard page-level `minWidth`; keep chart and table local scroll containers.
5. Update completion report.
6. Run:
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
7. Stop.

