# Sprint 11.3 Current Audit

Targets:

- `src/components/dashboard/dashboard-page-client.tsx`
- `src/components/schedule/schedule-page-client.tsx`
- `src/components/schedule/play-date-detail-client.tsx`

Known issues:

- Schedule delete actions still use `window.confirm`.
- Dashboard chart uses horizontal content width and must remain container-local.
- Schedule cards and session cards need viewport smoke tests.

