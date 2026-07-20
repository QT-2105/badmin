# Notifications Implementation Plan

Status: NOT APPLICABLE

## Precondition Result

No notification channel has a current backend, preference key, persistence source, handler, or Settings UI. Therefore no source implementation is allowed.

## Channel Plan

| Channel | Status | Implementation decision |
|---|---|---|
| In-app | MISSING | Do not implement toggle or UI. |
| Email | MISSING | Do not implement delivery or UI. |
| Push | MISSING | Do not implement subscription or UI. |
| Sound | MISSING | Do not implement preference or UI. |
| Desktop notification | MISSING | Do not request browser permission or implement UI. |

## Protected Behavior

- Do not request browser notification permission on page load.
- Do not register push subscription.
- Do not create email delivery.
- Do not add notification preference keys.
- Do not add API, repository, service, database, Prisma, query key, mutation, or payload.

## Implementation Decision

- Documentation-only update.
- Mark Notification Settings as Future Scope.
- No source code changes.

## Validation Commands

- `npm run lint`
- `npm run typecheck`
- `npm run build`
