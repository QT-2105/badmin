# Data Backup Current Audit

Status: NOT APPLICABLE

## Source Audit Summary

- No export route, service, repository, hook, mutation, UI action, or download handler exists.
- No import route, parser, validation flow, upload handler, mutation, or UI action exists.
- No backup route, storage mechanism, repository, service, mutation, progress state, or UI action exists.
- No restore route, restore parser, overwrite/merge semantics, mutation, or UI action exists.
- No administrative activity log route, repository, service, query, or settings UI exists.
- Existing data cleanup is limited to two destructive maintenance actions:
  - Reset match history through `resetMatchHistory()` -> `DELETE /api/match-history/reset`.
  - Delete all player images through `deleteAllPlayerImages()` -> `DELETE /api/settings/player-images`.
- These cleanup actions are already rendered in Settings and are protected by `settings.manage`.
- Sprint 10.9 allowed files do not include source implementation candidates, so no presentation code changes are allowed in this sprint.

## Capability Matrix

| Capability | Current source | Handler | Permission | Status | Decision |
|---|---|---|---|---|---|
| Export | None found | None | N/A | MISSING | Future Scope only. Do not create action. |
| Import | None found | None | N/A | MISSING | Future Scope only. Do not create upload/import UI. |
| Backup | None found | None | N/A | MISSING | Future Scope only. Do not create client-only backup. |
| Restore | None found | None | N/A | MISSING | Future Scope only. Do not create restore UI. |
| Data cleanup: match history | `settings-service.ts`, `/api/match-history/reset`, `match-history-repository.ts` | `resetMatchHistory()` | `settings.manage` | PARTIAL | Existing destructive maintenance only. No Sprint 10.9 source changes. |
| Data cleanup: player images | `settings-service.ts`, `/api/settings/player-images`, `player-images-repository.ts` | `deleteAllPlayerImages()` | `settings.manage` | PARTIAL | Existing destructive maintenance only. No Sprint 10.9 source changes. |
| Activity logs | None found | None | N/A | MISSING | Future Scope only. Do not display fake history. |

## Action Contract

| Action | Capability status | Handler | Permission | Input | Output | Destructive | Confirmation | Rollback | Required preservation |
|---|---|---|---|---|---|---|---|---|---|
| Export data | MISSING | None | N/A | N/A | N/A | No | N/A | N/A | Do not implement. |
| Import data | MISSING | None | N/A | N/A | N/A | Potentially | N/A | N/A | Do not implement. |
| Create backup | MISSING | None | N/A | N/A | N/A | No | N/A | N/A | Do not implement client-only backup. |
| Restore backup | MISSING | None | N/A | N/A | N/A | Yes | N/A | N/A | Do not implement. |
| Reset match history | PARTIAL | `resetMatchHistory()` | `settings.manage` | None | `{ deletedMatches, deletedParticipants }` | Yes | Existing `window.confirm` | No restore source | Preserve existing API, handler, confirmation, and payload. |
| Delete all player images | PARTIAL | `deleteAllPlayerImages()` | `settings.manage` | None | `{ deletedImages }` | Yes | Existing `window.confirm` | No restore source | Preserve existing API, handler, confirmation, and payload. |
| View activity logs | MISSING | None | N/A | N/A | N/A | No | N/A | N/A | Do not implement fake logs. |

## Protected Logic

- Export/import/backup/restore logic does not exist and must not be invented.
- Cleanup implementation remains owned by existing services, API routes, repositories, DB, and S3 helpers.
- Permission enforcement remains `settings.manage`.
- No overwrite/merge, restore, file-size, file-type, parser, backup storage, or activity log semantics exist today.

## Conclusion

Sprint 10.9 is documentation-only. Missing data operation capabilities stay Future Scope. Existing cleanup actions are acknowledged but not modified in this sprint.
