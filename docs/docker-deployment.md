# Docker Deployment And CI/CD

## Files

- `Dockerfile`: production image for the Next.js app using Next standalone output.
- `docker-compose.yml`: production app service using a prebuilt image and external Neon/Postgres through `.env`.
- `.dockerignore`: excludes local build artifacts, dependencies, and secrets.
- `.env.docker.example`: deployment environment template.
- `.github/workflows/ci-cd.yml`: validates source, builds Docker image, and pushes to GHCR on `main`.
- `.github/workflows/deploy.yml`: manual SSH deploy workflow for a prebuilt image.

## Prepare Environment

On the server:

```bash
cp .env.docker.example .env
```

Set:

```env
NEXT_PUBLIC_APP_URL=https://your-domain.com
APP_PORT=3000
BADMIN_IMAGE=ghcr.io/OWNER/REPO:latest
DATABASE_URL=postgresql://...
DATABASE_URL_UNPOOLED=postgresql://...
```

Use Neon/Postgres URLs with SSL enabled.

## Run On Server

The production compose file expects a prebuilt image from CI/CD:

```bash
export BADMIN_IMAGE=ghcr.io/OWNER/REPO:latest
docker compose pull badmin
docker compose up -d --no-build badmin
```

If the GHCR package is private, log in on the server once before pulling:

```bash
echo "GHCR_TOKEN" | docker login ghcr.io -u GITHUB_USERNAME --password-stdin
```

Check logs:

```bash
docker compose logs -f badmin
```

Stop:

```bash
docker compose down
```

## Update Deployment

Deploy a CI-built image:

```bash
export BADMIN_IMAGE=ghcr.io/OWNER/REPO:latest
docker compose pull badmin
docker compose up -d --no-build badmin
```

## Local Image Build

For local verification or emergency server-side build, build the image explicitly, then run compose:

```bash
docker build -t badmin:local .
export BADMIN_IMAGE=badmin:local
docker compose up -d --no-build badmin
```

Do not rely on server-side source builds for normal production deployment. CI/CD should build and publish the image.

## GitHub Actions Setup

Required repository secrets for manual deploy:

- `SERVER_HOST`: server IP or hostname
- `SERVER_USER`: SSH user
- `SERVER_SSH_KEY`: private SSH key allowed to access the server
- `SERVER_PORT`: SSH port, usually `22`
- `SERVER_APP_DIR`: directory containing `docker-compose.yml` and `.env`

The `CI/CD` workflow:

- runs `npm ci`
- runs `prisma generate`
- blocks automatic DB schema migration commands in workflow, Docker, compose, and package scripts
- runs lint, typecheck, and production build
- builds Docker image
- pushes `latest` and `sha-*` tags to GHCR on `main`

The `Deploy` workflow is manual. Pick the image tag to deploy, then it runs:

```bash
docker compose pull badmin
docker compose up -d --no-build badmin
```

## Database Notes

This compose file does not start a local Postgres service. The current project uses external Neon/Postgres through `DATABASE_URL` and `DATABASE_URL_UNPOOLED`.

This repository currently uses reviewed SQL files in `prisma/manual-migrations`.

Before production traffic:

1. Review pending SQL files.
2. Apply them to Neon in order.
3. Verify tables/constraints.
4. Deploy the app image.

Do not run `prisma migrate dev` against production.
Do not run `prisma db push` against production unless the owner explicitly approves the schema change.
Do not add `prisma migrate deploy` to Docker, compose, or GitHub Actions without explicit owner approval.

Deployment is allowed to run normal application queries and runtime CRUD through the app service. It must not alter database structure automatically.

## Healthcheck

Docker healthcheck uses:

```text
/api/health
```

This endpoint does not query the database. It only verifies that the Next.js server is alive.
