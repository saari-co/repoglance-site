# CMS access runbook

Reviewable preparation only. Nothing here creates Cloudflare resources,
enables Access, deploys, or changes DNS. Every step below is a maintainer
action.

## How production behaves

- `src/emdash-namespace-guard.ts` runs before EmDash. In production builds it
  answers 404 for every path under `/_emdash`, including setup and login,
  unless **all** of these hold:
  - the build set `EMDASH_ACCESS_TEAM_DOMAIN`, which wires EmDash's official
    `access()` auth in `astro.config.mjs` and is compiled into the guard (the
    one input configures both; it is not read at runtime),
  - the Worker has the `CF_ACCESS_AUDIENCE` secret,
  - the request carries a valid Cloudflare Access JWT for that audience, and
  - when `EMDASH_OPERATOR_ALLOWLIST` is set, the identity's email is on it.
- The guard reads the audience and allowlist from the Worker's
  `cloudflare:workers` `env` (bindings and secrets) and then from
  `process.env` (populated by the `nodejs_compat_populate_process_env` flag,
  which EmDash's own `authenticate` also relies on for the audience). A failed
  read counts as not configured. `Astro.locals.runtime.env` is gone in Astro
  6+ and is not used.
- EmDash gives the **first** Access-provisioned login the Admin role (50)
  regardless of `defaultRole`; later logins get `defaultRole` (40, the level
  the official Cloudflare guide maps editors to). That is why the allowlist
  stays owner-only until setup is closed.
- `wrangler.jsonc` declares a `worker_loaders` binding (`LOADER`), which
  EmDash's `sandbox()` needs for sandboxed plugins and which requires the
  Workers Paid plan. On a free plan remove that binding and the `sandbox()`
  runner (sandboxed plugins are then disabled at build time, which this site
  does not need).
- Public pages never depend on the CMS: `ContentPage.astro` reads the CMS
  entry and falls back to `seed/seed.json`. The response carries
  `data-content-source="cms"` or `"seed"`.
- The Astro Cloudflare adapter adds a `SESSION` KV binding to the built
  config for Astro sessions, and `wrangler deploy` auto-provisions a KV
  namespace named `repoglance-site-session` for it on first deploy (it did
  so on 2026-10-01). The site uses no sessions; the namespace stays empty.

## Values that stay out of source

Set only as Wrangler secrets, in ignored `.dev.vars`, or in a local overlay.
Do not add a `.env` to the repository.

- `EMDASH_ACCESS_TEAM_DOMAIN`: build input only (`<team>.cloudflareaccess.com`), set in the build environment, never as a Worker var.
- `CF_ACCESS_AUDIENCE`: runtime Access audience tag.
- `EMDASH_OPERATOR_ALLOWLIST`: runtime comma-separated operator emails.
- `EMDASH_ENCRYPTION_KEY`: EmDash plugin-secret key
  (`npx emdash secrets generate`).

Account, zone, database and bucket identifiers also stay out of source; the
ids in `wrangler.jsonc` are local placeholders.

## Human bootstrap order

1. Create the Worker, D1 and R2 for repoglance.com with `workers.dev` and
   preview URLs off. Do not attach the custom domain yet.
2. Create the Cloudflare Access application for `repoglance.com/_emdash/*`
   with a policy naming only the maintainer.
3. Set the secrets above; keep `EMDASH_OPERATOR_ALLOWLIST` owner-only.
4. Build with `EMDASH_ACCESS_TEAM_DOMAIN` set and deploy to the staging
   hostname. Confirm anonymous `/_emdash` still answers 404.
5. Complete EmDash setup through Access (site title, seed). Confirm setup is
   closed.
6. Attach the custom domain and DNS last, after public pages and setup are
   verified.

Each step is a hard gate in `AGENTS.md`.

## Deploying the public pages (maintainer, gated)

The public pages need no CMS, no Access and no secret to serve: they render
from the seed on a fresh D1 (the smoke proves it). Each step below is a
hard gate from `AGENTS.md`.

1. `npx wrangler login` in a terminal (the OAuth token stays in Wrangler's
   own store; never paste it anywhere).
2. Create the resources once:

   ```sh
   npx wrangler d1 create repoglance-site-cms
   npx wrangler r2 bucket create repoglance-site-media
   ```

   Keep the printed database id out of source; export it as
   `REPOGLANCE_D1_ID` in the deploying shell (or an ignored `.local/`
   file you source).
3. Build and write the ignored production config, then deploy:

   ```sh
   npm run build
   REPOGLANCE_D1_ID=... REPOGLANCE_WORKERS_DEV=true npm run prepare:deploy
   npx wrangler deploy --config dist/server/wrangler.production.json
   ```

   `REPOGLANCE_WORKERS_DEV=true` serves the Worker on its workers.dev
   hostname for a first look; `/_emdash` answers 404 there because Access
   is not configured. On a free Workers plan add
   `REPOGLANCE_SANDBOX=false` to drop the `worker_loaders` binding.
4. Go live: re-run `prepare:deploy` with
   `REPOGLANCE_CUSTOM_DOMAIN=repoglance.com,www.repoglance.com` (and
   `REPOGLANCE_WORKERS_DEV` unset) and deploy again. Wrangler creates the
   DNS records for the custom domains in the zone and turns workers.dev off.
5. The CMS stays denied until the Access steps above are done.
