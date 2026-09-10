# Engineering governance

Version: 2026-08-25

## Authority

Use this order when information conflicts:

1. explicit owner instruction;
2. working source and Prisma schema;
3. `AGENTS.md`;
4. canonical docs in this directory;
5. `rules/*.yaml`;
6. reusable prompts.

Preserve working behavior and reconcile governance in the same approved change.
Git history is the source for removed stage/sprint evidence; it is not current
authority.

## Protected boundaries

Owner approval is required before changing:

- player/court lifecycle and immediate post-match return;
- late-arrival, wait protection, `Trận kế`, `End-Game`, Couple, exact
  quartet, eligibility, replacement, or scoring philosophy;
- runtime DB sync and revision strategy;
- session completion finance or shuttlecock movement semantics;
- session-scoped player architecture;
- root navigation or tablet/mobile runtime hierarchy;
- settings storage boundaries;
- authentication, bootstrap, roles, permissions, or route guards;
- tenant identity, tenant isolation, Control Plane contracts, club lifecycle,
  or effective entitlement enforcement;
- activation of a second customer club before isolation release gates pass;
- database target, schema application, or production-data access.

An escalation must state the exact behavior, reason, operational/DB risk, and a
smaller safe alternative.

## Forbidden autonomous refactors

Do not introduce:

- global players/memberships or tournaments;
- subscription, billing, promotion, or system-administration management inside
  Badmin instead of the separate Control Plane;
- event sourcing, CQRS, or replay-driven live state;
- mandatory court catalogs or enterprise court identity;
- mandatory auto-matchmaking or auto-apply;
- hidden cooldowns or continuous runtime DB write loops;
- accounting ERP, warehouse ERP, or broad admin/settings platforms;
- merged application-user and session-player identity;
- permission bypasses or public administrative mutations;
- automatic schema application or routine production-data access.

Do not rewrite protected runtime modules for abstraction purity or block
optimistic UI on database writes.

## Safe incremental work

Safe work includes verified unused-code cleanup, tests that capture approved
behavior, validation/error improvements, responsive presentation fixes,
read-only audits, diagnostics that expose no secrets, and aligned
docs/rules/prompts updates.

Extend the existing operational flow incrementally. New product categories,
multi-location architecture, background realtime services, or changes to
protected semantics require a separate decision.

The approved Multi-Tenant design authorizes documentation and phased planning,
not a big-bang implementation or automatic DB mutation. Each implementation
phase in `multi-tenant.md` retains its own review, environment confirmation,
validation, and rollback gate.

## Performance and validation

Runtime actions should feel immediate. Avoid DB calls on render, hover, local
selection, or unapproved timers. Keep render complexity, headers, scroll areas,
and card dimensions bounded.

Relevant validation:

```text
npm test
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
git diff --check
```

For DB-sensitive work also validate Prisma and perform only owner-approved,
read-only target/drift inspection.

## Documentation discipline

Document stable architecture, behavior, and safety boundaries—not source file
inventories, branch names, bundle snapshots, sprint plans, completion reports,
or facts already obvious from current code.

Update docs, rules, and prompts together when approved behavior changes. Keep
historical implementation detail in Git rather than restoring stage folders.
