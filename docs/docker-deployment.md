# Docker deployment

Version: 2026-08-22

## Runtime shape

`Dockerfile` builds a Next.js standalone image. `docker-compose.yml` runs only
the app and connects to external Neon/PostgreSQL through `.env`; it does not
start or migrate a database.

Required deployment values:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_PORT=3000
BADMIN_IMAGE=ghcr.io/OWNER/REPO:latest
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...
BADMIN_RUNTIME_DB_ROLE=
```

Use a beta target isolated from production for development. Confirm both DB
URLs before schema-sensitive work.

`BADMIN_RUNTIME_DB_ROLE=badmin_uat_app` is an UAT-only effective-role mode and
uses the unpooled URL. Production should place a dedicated least-privilege
LOGIN directly in the pooled `DATABASE_URL` and leave this override empty.

## Image and compose

Normal deployment uses a prebuilt image:

```bash
docker compose pull badmin
docker compose up -d --no-build badmin
docker compose logs -f badmin
```

For local image verification:

```bash
docker build -t badmin:local .
export BADMIN_IMAGE=badmin:local
docker compose up -d --no-build badmin
```

Private GHCR packages require a one-time server login.

## GitHub workflows

`.github/workflows/ci-cd.yml` runs on pull requests or manual dispatch. It
installs dependencies, generates Prisma Client, runs the DB-automation guard,
lint, typecheck, build, and Docker build. Non-PR manual runs may push the image.

`.github/workflows/deploy.yml` runs on pushes to `main`. It validates and builds,
pushes `ghcr.io/qt-2105/badmin:latest` plus a SHA tag, then deploys over SSH to
`/opt/ttclubminton`.

Secrets consumed by the deploy workflow:

- `SERVER_HOST`
- `SERVER_USER`
- `SERVER_SSH_KEY`
- `SERVER_PORT` (optional; defaults to `22`)
- `GHCR_PAT`

## Database safety and health

Schema changes use reviewed SQL under `prisma/manual-migrations` and explicit
owner-approved application to the confirmed target. Do not add `prisma migrate
deploy`, `prisma migrate dev`, or `prisma db push` to Docker, compose, CI, or
application startup.

The container healthcheck calls `/api/health`. It proves process liveness only,
not database reachability; DB readiness requires a separate diagnostic until an
approved readiness endpoint exists.
