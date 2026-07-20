# Data Backup Implementation Plan

Status: NOT APPLICABLE

## Precondition Result

Sprint 10.9 does not have source implementation candidates in `02_ALLOWED_FILES.md`.

Capability result:

| Capability | Status | Implementation decision |
|---|---|---|
| Export | MISSING | Do not implement action, download, or success state. |
| Import | MISSING | Do not implement upload, parser, validation, or success state. |
| Backup | MISSING | Do not implement backup action or client-only backup. |
| Restore | MISSING | Do not implement restore action or destructive confirmation flow. |
| Data cleanup | PARTIAL | Existing destructive actions remain unchanged; no Sprint 10.9 source change. |
| Activity logs | MISSING | Do not implement fake logs or derived audit history. |

## Implementation Plan

1. Keep Sprint 10.9 documentation-only.
2. Record Missing capabilities as Future Scope.
3. Record existing cleanup as Partial, handled by existing Settings maintenance actions.
4. Do not edit Settings source code, services, APIs, repositories, Prisma, hooks, query keys, mutations, permissions, or routes.
5. Run validation.
6. Update completion report and stop.

## Action Preservation Table

| Action | Capability status | Handler | Permission | Required preservation |
|---|---|---|---|---|
| Export data | MISSING | None | N/A | No UI or handler. |
| Import data | MISSING | None | N/A | No UI or handler. |
| Create backup | MISSING | None | N/A | No UI, no client-only backup. |
| Restore backup | MISSING | None | N/A | No UI, no restore semantics. |
| Reset match history | PARTIAL | `resetMatchHistory()` | `settings.manage` | Existing source behavior unchanged. |
| Delete all player images | PARTIAL | `deleteAllPlayerImages()` | `settings.manage` | Existing source behavior unchanged. |
| View activity logs | MISSING | None | N/A | No fake activity log UI. |

## Out of Scope / Future Scope

- Data export scope and format.
- Import parser and validation.
- Backup storage and restore mechanism.
- Restore overwrite/merge semantics.
- Progress reporting.
- Download/export history.
- Administrative activity logs.
- Rollback strategy after destructive restore.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build` at checkpoint or when source changes
- `npm run guard:no-db-schema-automation` at checkpoint or completion
