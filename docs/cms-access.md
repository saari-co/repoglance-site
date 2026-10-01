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

The public site is live from the seed first (see the deploy section below).
The editor is enabled afterwards, in this order. Wrangler's login on the
build machine has no Zero Trust scope, so the Access application is created
in the maintainer's own dashboard session (an agent may drive the
maintainer's browser for it, mirroring the existing DinkusKit CMS
application); secret values are piped into `wrangler secret put` and never
printed. This was done for repoglance.com on 2026-10-01
(`proof/cms-access-20261001/PROOF.md`).

1. **Zero Trust team.** Cloudflare dashboard, Zero Trust. If the account has
   no team yet, onboarding asks for a team name; the team domain is
   `<team>.cloudflareaccess.com` and is shown under Settings, Custom Pages
   (or in the URL of the Zero Trust dashboard). The free plan covers this.
2. **Access application.** Zero Trust, Access, Applications, Add an
   application, Self-hosted:
   - Application name: `RepoGlance CMS`.
   - Session duration: 24 hours.
   - Public hostnames: `repoglance.com` with path `_emdash`, and a second
     entry `www.repoglance.com` with path `_emdash`.
   - Identity providers: the maintainer's existing Google provider only, with
     instant authentication (the DinkusKit CMS pattern).
   - Policy: add the maintainer's existing reusable owner policy (the one
     the DinkusKit CMS application uses). No other rules.
   - Save. The application's audience (AUD) tag is on its settings tab; it is
     also the `kid` parameter of the login redirect that an anonymous request
     to the gated path now receives.
3. **Secrets**, from the maintainer's own terminal in a checkout where
   `npx wrangler whoami` shows the right account. Each command reads the
   value from the terminal or a pipe; nothing is pasted into chat:

   ```sh
   npx wrangler secret put CF_ACCESS_AUDIENCE --name repoglance-site
   npx wrangler secret put EMDASH_OPERATOR_ALLOWLIST --name repoglance-site
   npx emdash secrets generate --write .local/secrets.env
   grep '^EMDASH_ENCRYPTION_KEY=' .local/secrets.env | cut -d= -f2- | npx wrangler secret put EMDASH_ENCRYPTION_KEY --name repoglance-site
   ```

   `CF_ACCESS_AUDIENCE` is the AUD tag; `EMDASH_OPERATOR_ALLOWLIST` is the
   owner's email (the identity that completes setup), owner-only until setup
   is closed; the encryption key stays in the ignored `.local/secrets.env`
   and in Cloudflare. Values may be piped (`printf '%s' "$VALUE" | npx wrangler
   secret put NAME --name repoglance-site`) as long as nothing prints them.
4. **Team domain for the build.** Add
   `EMDASH_ACCESS_TEAM_DOMAIN=<team>.cloudflareaccess.com` to the ignored
   `.local/deploy.env`. It is a build input: it wires EmDash's `access()`
   and the guard from one value.
5. **Build and deploy** (agent or maintainer):

   ```sh
   set -a; . ./.local/deploy.env; set +a
   npm run build
   REPOGLANCE_CUSTOM_DOMAIN=repoglance.com,www.repoglance.com npm run prepare:deploy
   npx wrangler deploy --config dist/server/wrangler.production.json
   ```

   Then confirm anonymous `https://repoglance.com/_emdash/admin` still
   answers 404 (no Access JWT, so the guard denies before EmDash).
6. **First login and setup.** The maintainer opens
   `https://repoglance.com/_emdash/admin`, passes the one-time PIN, and
   completes EmDash setup (site title, and include the seed content so the
   pages switch to the CMS). The first Access login becomes Admin. Confirm
   setup is closed: a second anonymous request to the setup routes still
   answers 404, and the pages report `data-content-source="cms"`.
7. **Second editor**, only after setup is closed: add the email to the
   Access policy and to `EMDASH_OPERATOR_ALLOWLIST` (a new `secret put`).
   Their installed EmDash role is `defaultRole` 40.

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
