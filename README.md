# Badmin

Badmin is a Next.js/TypeScript operations platform for realtime badminton sessions. It combines touch-first court orchestration, session-scoped players, lightweight finance, shuttlecock inventory, authentication, and permission-guarded administration.

## Current product surface

- Dashboard
- Lịch chơi
- Thu chi
- Kho cầu
- Người dùng
- Cài đặt
- Contextual runtime at `/sessions/[sessionId]/runtime`

The Play Session is the operational boundary. Zustand owns immediate runtime responsiveness; PostgreSQL/Prisma stores durable current-state snapshots and recovery data.

## Stack

- Next.js 15 App Router and React 19
- TypeScript
- Zustand and TanStack Query
- Prisma with Neon PostgreSQL
- Tailwind CSS
- Vitest and ESLint
- S3-compatible object storage for branding, QR, and player images

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env` and use development/beta credentials only.
3. Generate Prisma Client with `npm run prisma:generate`.
4. Apply reviewed SQL from `prisma/manual-migrations` only when the owner has approved the target database and migration.
5. Start with `npm run dev`.

Never point a development workspace at the production database. Do not run `prisma migrate dev`, `prisma migrate deploy`, or `prisma db push` against shared/production data without explicit owner approval.

## Quality commands

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm run guard:no-db-schema-automation
git diff --check
```

## Governance

Read [AGENTS.md](./AGENTS.md), [docs/README.md](./docs/README.md), the canonical files under `docs/`, and all files under `rules/` before architecture-sensitive work.

- `docs/architecture.md`, `multi-tenant.md`, `runtime.md`,
  `data-and-operations.md`, `ui-ux.md`, `governance.md`, and `readiness.md`:
  current contracts and the explicitly marked Multi-Tenant target
- removed UI stage/sprint records: historical Git evidence only
- `rules/**`: machine-readable constraints
- `prompts/**`: reusable workflows aligned with current governance
- `prisma/schema.prisma`: application datamodel
- `prisma/manual-migrations/**`: owner-reviewed SQL history
