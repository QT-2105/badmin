# User And Permission Safety Contract

Stage 09 only changes Presentation Layer.

## Do Not Change

Stage 09 must not change:

1. Authentication provider.
2. Session creation.
3. Session expiration.
4. Token creation.
5. Token validation.
6. Cookie configuration.
7. Login behavior.
8. Logout behavior.
9. Password hashing.
10. Password comparison.
11. Password reset.
12. Invitation token.
13. User ID.
14. Email identity.
15. Role code.
16. Permission key.
17. Permission code.
18. Role-permission mapping.
19. User-role mapping.
20. Account status values.
21. Active semantics.
22. Inactive semantics.
23. Locked semantics.
24. Pending semantics.
25. Authorization checks.
26. Route guards.
27. Middleware.
28. Server-side permission checks.
29. Client-side visibility checks.
30. API payload.
31. Validation.
32. Query keys.
33. Mutations.
34. Cache invalidation.
35. Repository.
36. Service.
37. Database.
38. Prisma.
39. Routes.
40. Permission escalation rules.

Shared UI components must not contain authorization logic.

UI visibility is not a security boundary. Sensitive actions must continue to rely on the current server-side authorization or existing protection layer.

## Forbidden In Stage 09

- Add role.
- Remove role.
- Rename role code.
- Add permission.
- Remove permission.
- Rename permission key.
- Change default permission semantics.
- Change who can save role permissions.
- Change Owner protection rules.
- Change self-lock/self-demotion protections.
- Change session expiry.
- Change cookie name or flags.
- Change password hashing.
- Change login rate limiting.
- Change API authorization.
- Change middleware matching.
- Move authorization checks into shared UI primitives.
- Treat hidden UI as sufficient security.

## Protected Files

- `middleware.ts`
- `prisma/schema.prisma`
- `src/app/api/auth/**`
- `src/lib/auth/**`
- `src/hooks/use-auth.ts`
- `src/services/auth-service.ts`
- `src/repositories/auth-users-repository.ts`
- `src/repositories/role-permissions-repository.ts`

## Protected Functions And Constants

- `middleware`
- `AUTH_COOKIE_NAME`
- `SESSION_MAX_AGE_SECONDS`
- `createAuthSession`
- `getCurrentUserByToken`
- `getCurrentUserFromCookies`
- `destroyAuthSession`
- `setAuthCookie`
- `clearAuthCookie`
- `hashPassword`
- `verifyPassword`
- `assertLoginAllowed`
- `recordFailedLogin`
- `requireApiUser`
- `requireApiPermission`
- `requirePageUser`
- `USER_ROLES`
- `USER_STATUSES`
- `PERMISSION_DEFINITIONS`
- `DEFAULT_ROLE_PERMISSIONS`
- `ROUTE_PERMISSION_RULES`
- `hasPermission`
- `getRoutePermission`
- `listAuthUsers`
- `createAuthUser`
- `updateAuthUser`
- `listRolePermissions`
- `getPermissionsForRole`
- `updateRolePermissions`

If a UI request requires changing any protected function or file, stop and record it as Out of Scope.

If source does not already have a capability:

- Do not create that capability.
- Record it as Missing Capability.
- Put it in Future Scope.
