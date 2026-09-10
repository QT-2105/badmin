# Heroku, Neon And Namecheap Deployment

Production is deployed from GitHub Actions to the Heroku Container Registry.
The database is an external Neon Postgres project. Database schema changes are
reviewed and applied manually; application deployment never changes the schema.

## 1. One-time Heroku setup

Create or select the Heroku app and switch it to the container stack:

```bash
heroku stack:set container --app HEROKU_APP_NAME
```

In Heroku **Settings > Config Vars**, set the values from
`.env.heroku.example`:

- `NEXT_PUBLIC_APP_URL`: the final HTTPS application URL.
- `DATABASE_URL`: the pooled connection string copied from Neon **Connect**.
- `DATABASE_URL_UNPOOLED`: the direct connection string copied from Neon
  **Connect**.
- `NEXT_TELEMETRY_DISABLED=1`.
- the six `S3_*` values when uploads are enabled.

Do not put production connection strings in the repository or Docker image.
Keep both Neon URLs configured with TLS/SSL parameters supplied by Neon.

## 2. GitHub production environment

Create a GitHub environment named `production`, then configure:

Environment secret:

- `HEROKU_API_KEY`: Heroku account API key allowed to deploy the app.

Environment variables:

- `HEROKU_APP_NAME`: exact Heroku app name.
- `NEXT_PUBLIC_APP_URL`: final HTTPS URL, without a trailing slash.

Protect the environment with required reviewers when the repository plan
supports deployment protection rules.

Pull requests run install, Prisma generation, the DB automation guard, lint,
typecheck, tests, a production build, and a Heroku-compatible `linux/amd64`
container build. A successful push to `main` repeats validation, builds the
production image, pushes it to Heroku, releases the `web` process, and checks
`/api/health` through the app URL returned by Heroku. The deploy job also
verifies that both required Neon Config Vars exist without printing their
values.

## 3. Neon database

Use the pooled Neon URL for normal application traffic and the direct URL only
for reviewed administrative/schema work:

| Heroku Config Var | Neon connection |
| --- | --- |
| `DATABASE_URL` | Pooled connection |
| `DATABASE_URL_UNPOOLED` | Direct/unpooled connection |

Before the first production release, review the SQL files in
`prisma/manual-migrations` and apply only the required files, in timestamp
order, through the Neon SQL Editor or a controlled `psql` session using the
direct URL. Verify the resulting tables and constraints before enabling live
traffic.

The CI/CD workflow intentionally does not run `prisma migrate`, `prisma db
push`, or any SQL file. Never run `prisma migrate dev` against production.

## 4. Namecheap custom domain

A subdomain such as `app.example.com` is recommended. The first deployment can
run before DNS is active because CI verifies the Heroku app URL directly.

1. Add the custom domain in Heroku:

   ```bash
   heroku domains:add app.example.com --app HEROKU_APP_NAME
   ```

2. Copy the DNS target returned by Heroku. It normally resembles a
   `*.herokudns.com` hostname.
3. Open Namecheap **Advanced DNS** and add:

   | Type | Host | Value | TTL |
   | --- | --- | --- | --- |
   | CNAME | `app` | Exact Heroku DNS target | Automatic |

4. Remove any conflicting `A`, `AAAA`, `CNAME`, or redirect record for the same
   host.
5. Enable Heroku Automated Certificate Management:

   ```bash
   heroku certs:auto:enable --app HEROKU_APP_NAME
   ```

6. Wait for DNS and certificate activation, then verify:

   ```bash
   heroku domains:wait app.example.com --app HEROKU_APP_NAME
   curl --fail https://app.example.com/api/health
   ```

For the root/apex domain, use a Namecheap `ALIAS` record at host `@` only when
the account/DNS configuration supports it, pointing to the exact Heroku DNS
target. Otherwise redirect the apex domain to the configured `www` or `app`
subdomain. Do not point the custom hostname at a Heroku IP address.

## 5. Rollback

Use the Heroku dashboard or CLI to inspect releases and roll back to a known
good release:

```bash
heroku releases --app HEROKU_APP_NAME
heroku rollback vNN --app HEROKU_APP_NAME
```

Rollback changes the application release only. It does not reverse Neon schema
or data changes.
