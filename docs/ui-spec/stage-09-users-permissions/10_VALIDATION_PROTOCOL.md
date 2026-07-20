# Validation Protocol

## Required Commands For Implementation Sprints

```bash
npm run lint
npm run typecheck
```

Checkpoint sprints must also run:

```bash
npm run build
npm run guard:no-db-schema-automation
```

## Protected Diff Checks

After each implementation sprint, verify no diff in:

```bash
git diff -- middleware.ts src/app/api/auth src/lib/auth src/hooks/use-auth.ts src/services/auth-service.ts src/repositories/auth-users-repository.ts src/repositories/role-permissions-repository.ts prisma
```

## Manual Regression Checks

- Login page still loads.
- Bootstrap state still works when no users exist.
- Login with active user still works.
- Disabled user cannot login.
- `/users` requires `users.manage`.
- User creation still sends same payload.
- User update still sends same payload.
- Password update still hashes through existing backend logic.
- Owner-only role permission update remains owner-only.
- Non-owner role permission save remains disabled/blocked.
- Last active owner safeguards remain intact.
- Permission-based nav visibility remains unchanged.
- Session-expired redirect still works.

## Stop Criteria

Stop immediately if:

- A security file must be changed to achieve a presentation task.
- A role or permission key needs to be renamed.
- A payload or mutation needs to change.
- Route guard behavior changes.
- Auth session/cookie behavior changes.
- Validation or authorization behavior changes.
