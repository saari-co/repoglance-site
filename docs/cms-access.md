# CMS access runbook

Reviewable preparation only. Nothing here creates Cloudflare resources,
enables Access, deploys, or changes DNS. Every step below is a maintainer
action.

## How production behaves

- `src/outer-middleware.ts` is EmDash's outer middleware: first the www
  redirect (`src/www-redirect.ts`: every `www.repoglance.com` request answers
  a bodiless 301 to the same path and query on the apex, `/_emdash` included,
  since Access covers both hosts and the editor continues on the apex), then
  the namespace guard below. Nothing is ever served from the www host.
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
- Public pages never depend on the CMS: the page frontmatter calls
  `preparePage` in `src/content/load-page.ts`, which reads the CMS entry and
  falls back to `seed/seed.json`; `ContentPage.astro` only renders. The
  response carries `data-content-source="cms"` or `"seed"`.
- Edge cache: Astro's route cache with the Cloudflare provider
  (`astro.config.mjs`). A rendered public page opts in from
  `src/page-cache.ts` (five minutes fresh, one minute stale-while-revalidate,
  tagged with the `pages` collection and EmDash's entry tags, varied by
  `Host` and `Cookie`); every other response, including the whole `/_emdash`
  namespace (EmDash opts out), the 404 page and the redirect, carries
  `Cloudflare-CDN-Cache-Control: no-store`, so the guard runs for every
  namespace request. The adapter writes `cache.enabled` into the generated
  deploy config (`wrangler.jsonc` declares it too), which turns on Cloudflare's
  Workers Cache: no KV namespace, API token or dashboard rule is involved.
  EmDash's admin routes call Astro's `cache.invalidate` with the entry and
  collection tags on every write that changes live content (publish,
  unpublish, schedule, restore, discard draft, permanent delete, and an
  update when the live content changed; create and duplicate purge the
  collection tag, which every render carries), and the provider purges them
  through the Workers cache purge binding. Cloudflare
  keys the cache by Worker version as well, so a deploy starts cold, and the
  `version_metadata` binding (`CF_VERSION_METADATA`, the Worker's own version
  id, not a resource) lets the provider add an `astro-version:` tag and a
  version-scoped weak `ETag`, so a browser's conditional request never
  revalidates a body from another deploy or a retired entry. The TTL is the
  backstop if a purge fails. The Workers Cache keys by path and query, not by
  host; the `Host` variant is what keeps a cached apex page from answering
  www requests ahead of the redirect.
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

   **Setup copies the seed once.** EmDash setup imports `seed/seed.json`
   (pages and block types) as it is in the deployed build and never again;
   from then on `src/content/load-page.ts` renders the CMS entry whenever
   one exists, so later seed changes do not reach the live site until they
   are written into the CMS. On 2026-10-06 the 1 October entries were
   unpublished for that reason (`proof/cms-drift-20261006/PROOF.md`), and
   since then the sync below keeps the CMS equal to the seed; the pages
   render from the seed until its first run.
7. **Second editor**, only after setup is closed: add the email to the
   Access policy and to `EMDASH_OPERATOR_ALLOWLIST` (a new `secret put`).
   Their installed EmDash role is `defaultRole` 40.

## Keeping the CMS equal to the seed

Decision `cms-sync-011` (2026-10-07, `proof/cms-sync-20261007/PROOF.md`):
the seed is the only source of truth, the CMS is a copy of it that the
editor may read, and the live site is proven equal to the seed after every
deploy. Three commands, all run from a checkout of the deployed commit:

| Command | What it does | Identity |
| --- | --- | --- |
| `npm run cms:check` | Reports every difference between `seed/seed.json` and the CMS: each block type's label, category, description, icon and active-version fields; each page's slug, status and live data (title, description, layout blocks by key); anything in the CMS the seed does not declare. Exit 1 on drift. Read only. | your Access login (below) |
| `npm run cms:sync` | Writes the seed into the CMS and publishes it, then re-checks: block types first (a compatible change updates the active version in place; a breaking one, such as a removed select option, creates a new version, or reuses an inactive one with the same fields, and activates it), then each page as a draft with the revision token and block migration, then publish. Never deletes. | your Access login (below) |
| `npm run check:live` | After `npm run build`: renders both pages from the seed on local workerd, fetches them from the live site, reports the live `data-content-source` and edge-cache status, and fails unless the two `<main>` elements are identical. | none (public pages) |

The comparison ignores block `_version`: the seed describes a fresh install
(version 1) while the CMS's versions follow its own history. Rendering does
not depend on it.

**Identity.** The scripts sign in as you, through the Access login
`cloudflared` caches; no service token, no second Access policy, no EmDash
API token and no Worker secret is involved:

```sh
cloudflared access login https://repoglance.com/_emdash
```

opens the browser for your Google login once per Access session (24 hours
here). `npm run cms:check` and `npm run cms:sync` then read the cached JWT
with `cloudflared access token` and send it as `cf-access-token`; Access
admits it and EmDash maps it to your operator account, exactly as the admin
tab does. The scripts never print a token or header value. Without a cached
login they stop and print the command above.

**When.** After every deploy, in this order, from the deployed commit:

1. `npx wrangler deploy ...` (the deploy section below).
2. `npm run cms:sync` (the Worker that renders the new seed is live, so the
   CMS may now carry it).
3. `npm run check:live` (the live pages equal the seed render).

Never sync before the deploy: the live Worker would render new slugs with
old components. `npm run cms:check` alone is safe at any time.

If an editor holds an entry's edit lock in the admin, the sync refuses that
page; close the editor or pass `npm run cms:sync -- --override-lock`.

**Unattended runs (not built).** A sync from CI or a scheduler would need a
non-browser identity: a Cloudflare Access service token admitted by a
separate **Service Auth** policy on the `RepoGlance CMS` application, an
EmDash API token (`ec_pat_`, scopes `content:read`, `content:write`,
`schema:read`, `schema:write`, created by an Admin) sent as a Bearer token,
and a change to `src/namespace-gate.ts`, because a service-token JWT carries
no email (`sub` is empty, `common_name` is the client id) and the guard
denies it. The scripts already accept such headers through `EMDASH_HEADERS`
or `--header` and a token through `EMDASH_TOKEN`; the token, the policy and
the secrets are maintainer hard gates and would live in ignored `.local/`
files or repository secrets, never in source or chat.

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
6. After every deploy with Access configured: `npm run cms:sync`, then
   `npm run check:live` (the section above).
