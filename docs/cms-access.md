# CMS access runbook

Reviewable preparation only. Nothing here creates Cloudflare resources,
enables Access, deploys, or changes DNS. Every step below is a maintainer
action.

## How production behaves

- `src/emdash-namespace-guard.ts` runs before EmDash. In production builds it
  answers 404 for every path under `/_emdash`, including setup and login,
  unless **all** of these hold:
  - the build set `EMDASH_ACCESS_TEAM_DOMAIN` (so `astro.config.mjs` wired
    EmDash's official `access()` auth),
  - the Worker has the `CF_ACCESS_AUDIENCE` secret,
  - the request carries a valid Cloudflare Access JWT for that audience, and
  - when `EMDASH_OPERATOR_ALLOWLIST` is set, the identity's email is on it.
- The guard reads those values from the Worker's `cloudflare:workers` `env`
  (bindings and secrets) and then from `process.env` (populated by the
  `nodejs_compat_populate_process_env` flag). A failed read counts as not
  configured. `Astro.locals.runtime.env` is gone in Astro 6+ and is not used.
- Public pages never depend on the CMS: `ContentPage.astro` reads the CMS
  entry and falls back to `seed/seed.json`. The response carries
  `data-content-source="cms"` or `"seed"`.
- The Astro Cloudflare adapter logs that it would use a `SESSION` KV binding
  for Astro sessions. The site uses no sessions, so no KV namespace is
  declared or needed.

## Values that stay out of source

Set only as Wrangler secrets, in ignored `.dev.vars`, or in a local overlay.
Do not add a `.env` to the repository.

- `EMDASH_ACCESS_TEAM_DOMAIN`: build input (`<team>.cloudflareaccess.com`).
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
