# Documentation map

Version: 2026-08-27
Status: Canonical documentation index

## Reading order

1. `AGENTS.md`
2. [Architecture](./architecture.md)
3. [Multi-tenant architecture and migration](./multi-tenant.md) for the approved
   SaaS target, tenant isolation, or migration work
4. [Multi-tenant schema and integration contract](./multi-tenant-schema-contract.md)
   for model mapping, Phase 4 nullable expansion, and later tenant constraints
5. [Control foundation and Legacy Club](./multi-tenant-control-foundation.md)
   for the Phase 3 UAT migration, ownership, reconciliation, and read-only integration
6. [Next-layer readiness](./readiness.md) for current phase evidence, including
   Phase 13 provisioning rollout prerequisites
7. [Runtime and scheduling](./runtime.md) for live-session work
8. [Data and operations](./data-and-operations.md) for DB, finance, inventory,
   settings, or auth work
9. [UI and UX](./ui-ux.md) for presentation work
10. [Engineering governance](./governance.md)
11. `rules/*.yaml`, relevant source, Prisma schema, and reviewed SQL

## Authority

The current source of truth is:

1. owner instruction
2. working source and Prisma schema
3. `AGENTS.md`
4. canonical documents linked above
5. `rules/*.yaml`
6. reusable prompts

If these disagree, stop before changing protected semantics. Preserve the working behavior and reconcile governance in the same approved change.

## Historical documents

Legacy UI stages, sprint scopes, audits, progress logs, and completion reports
were removed from the working tree because they repeated stale snapshots. Use
Git history only when exact historical evidence is needed.

## Environment boundary

The current UAT workspace may contain a controlled production-copy dataset for
migration rehearsal. Treat it as sensitive production-derived data: do not
expose raw PII or credentials to AI output, do not infer that UAT is live, and
do not allow UAT storage, email, webhook, or other integrations to mutate
production systems. An intentionally empty beta database remains valid for
other isolated development work.

Schema inspection and drift checks are read-only. Schema mutation remains manual, reviewed, target-specific, and owner-approved.

The Multi-Tenant document is a target design and phased migration contract. It
must not be treated as evidence that tenant isolation is already implemented.

## Update discipline

- Update canonical docs, rules, and prompts together when approved behavior changes.
- Do not restore stage archives; use Git history only when exact evidence is needed.
- Include validation commands and known residual risk.
- Keep docs operational and implementation-aware; avoid speculative enterprise architecture.
