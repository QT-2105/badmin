# Badmin

Mobile-first badminton group management workspace for real-time court arrangement, player rotation, finance tracking, and offline-first session operations.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- shadcn/ui-style primitives
- Zustand
- Framer Motion
- TanStack Query
- PostgreSQL
- Prisma
- PWA/offline sync foundation

## What this scaffold includes

- Mobile-first dashboard shell for court operations
- Shared UI primitives for button and badge states
- Dark operational design language
- Prisma schema for users, players, sessions, courts, matches, pairings, attendance, transactions, expenses, tags, relationships, rotation history, and sync queue
- Prisma client helpers
- Environment variable template

## Getting started

1. Install dependencies.
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Generate the Prisma client. Review and apply database SQL separately when required.
4. Start the app in development mode.

```bash
npm install
npm run prisma:generate
npm run dev
```

## Scripts

- `npm run dev` - start the app locally
- `npm run build` - build for production
- `npm run start` - start the production build
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:studio` - open Prisma Studio

## Production deployment

Production CI/CD targets Heroku Container Registry, uses Neon Postgres, and can
serve a Namecheap-managed custom domain. See
[`docs/heroku-deployment.md`](docs/heroku-deployment.md) for the required
Heroku config vars, GitHub environment values, DNS records, health check, and
rollback procedure.

## Workspace structure

- `src/app` - App Router entry points and global layout
- `src/components/ui` - UI primitives
- `src/lib` - shared utilities and Prisma helpers
- `prisma/schema.prisma` - database schema

## Next steps

- Add auth routes for email/password and Google login
- Add offline queue persistence with IndexedDB
- Build court arrangement and rotation workflows
- Continue hardening session and finance persistence on PostgreSQL
- Add background sync and conflict resolution
