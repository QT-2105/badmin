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
- Supabase
- PostgreSQL
- Prisma
- PWA/offline sync foundation

## What this scaffold includes

- Mobile-first dashboard shell for court operations
- Shared UI primitives for button and badge states
- Dark operational design language
- Prisma schema for users, players, sessions, courts, matches, pairings, attendance, transactions, expenses, tags, relationships, rotation history, and sync queue
- Supabase and Prisma client helpers
- Environment variable template

## Getting started

1. Install dependencies.
2. Copy `.env.example` to `.env.local` and fill in the values.
3. Run Prisma generate and your database migration.
4. Start the app in development mode.

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

## Scripts

- `npm run dev` - start the app locally
- `npm run build` - build for production
- `npm run start` - start the production build
- `npm run lint` - run ESLint
- `npm run typecheck` - run TypeScript checks
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - create and apply a Prisma migration
- `npm run prisma:studio` - open Prisma Studio

## Workspace structure

- `src/app` - App Router entry points and global layout
- `src/components/ui` - UI primitives
- `src/lib` - shared utilities, env, Prisma, and Supabase helpers
- `prisma/schema.prisma` - database schema

## Next steps

- Add auth routes for email/password and Google login
- Add offline queue persistence with IndexedDB
- Build court arrangement and rotation workflows
- Wire session and finance mutations to Supabase/Postgres
- Add background sync and conflict resolution
