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
  with one anonymous exception, a `GET` or `HEAD` of the public media-file
  route `/_emdash/api/media/file/<key>` for a flat storage key (decision
  `media-library-014`: the pages' images are Media Library files; the
  media list, uploads, folders and every other media route stay behind
  Access), unless **all** of these hold:
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
  `Host` and `Cookie`); a served media file or image rendition (the public
  media-file route, Astro's image endpoint `/_image`) opts in the same way,
  tagged `media` and varied by `Host`, keeping the route's own validators
  (EmDash sends a weak ETag and Last-Modified for a stored file and its
  renditions, so a browser revalidates and a replaced original is stale at
  the edge for at most the fresh window); every other response, including
  the rest of the `/_emdash` namespace (EmDash opts out), a media 404, the
  404 page and the redirect, carries `Cloudflare-CDN-Cache-Control:
  no-store`, so the guard runs for every namespace request. The adapter
  writes `cache.enabled` into the generated
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
- Images: the Cloudflare adapter's `cloudflare-binding` image service with
  the `IMAGES` binding (`wrangler.jsonc`). `src/components/Screenshot.astro`
  asks the image endpoint for each width (`/_image?href=…&w=540&f=webp`,
  `w=1080`); EmDash's endpoint wrapper reads a Media Library file straight
  from R2 and resizes it with the binding, and the repository's own
  captures (the seed fallback, `/screenshots/<file>`) go through the
  adapter's endpoint and the `ASSETS` binding. The guard serves those
  renditions to everyone (an approved capture or a library file, 540 or
  1080 px, WebP, spelled exactly as the pages emit it, so one rendition
  is one cache key); any other request to the endpoint is served,
  uncached, only to an operator Access admits (the admin's Media gallery
  asks it for 400 px thumbnails of library files) and answers an uncached
  404 to everyone else, before anything is transformed. EmDash's own
  middleware returns a fresh copy of every response; the guard makes a
  second copy of a rendition before the route cache writes its headers.
  Nothing is transformed at build time. Local workerd and `astro dev`
  resize through Miniflare's local Images binding, so the smoke proves
  the renditions.
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

   **Setup copies the seed once, and that is the only time.** EmDash setup
   imports `seed/seed.json` (pages and block types) as it is in the deployed
   build, downloading each `$media` reference (the approved captures from
   the repository's `main`) into the Media Library; EmDash 1.2.0 stores the
   primary of each reference and drops the nested dark variant, so
   `npm run cms:media -- --apply` (below) completes the pairing and imports
   the captures the pages do not use. Two more facts of that resolver: it
   records no content hash for a sideloaded file (the scripts and the audit
   match such an item by file name, size and dimensions, and `cms:media`
   verifies its bytes), and it spends at most five downloads per setup
   request, so a capture two pages share can land twice in the library
   (the same bytes under two ids; `cms:media` lists the duplicate and
   nothing depends on it). From then on the CMS owns the content and
   `src/content/load-page.ts` renders the CMS entry whenever one exists.
   History: the 1 October entries were unpublished on 2026-10-06 because
   they predated the copy and imagery locks
   (`proof/cms-drift-20261006/PROOF.md`) and re-filled from the seed on
   2026-10-07 (`proof/cms-sync-20261007/PROOF.md`); since then edits are
   made in the admin and mirrored back (the section below).
7. **Second editor**, only after setup is closed: add the email to the
   Access policy and to `EMDASH_OPERATOR_ALLOWLIST` (a new `secret put`).
   Their installed EmDash role is `defaultRole` 40.

## Content, structure and the mirror

Decision `cms-first-013` (2026-10-07, `proof/cms-first-20261007/PROOF.md`,
replacing `cms-sync-011`): **the CMS owns content, the repository owns
structure, and the site mirrors itself into the repository.**

**Editing.** You edit and publish in the EmDash admin. The published page is
live at once and persists; nothing ever writes copy from `seed/seed.json`
into the CMS after the one-time bootstrap (EmDash setup imports the seed
when a brand-new site is first set up, and never again).

**Images (decision `media-library-014`).** The pages' images are Media
Library items: a hero or feature block has an `image` field (with a
dark-scheme variant) you fill from Content > Media in the admin; alt
text lives on the media item, and a block whose image is gone renders no
figure. The repository owns which images may appear: the approved
captures under `public/screenshots/`, recorded with their hashes and alt
text in `seed/media.json` (`docs/content.md`). The mirror writes the live
library and which block uses which item into that file beside the seed,
and `tests/media.test.mjs` judges it on the mirror PR: approved captures
only on the pages, honest alt text, the light cut as the primary with the
dark cut as its variant, every slot filled. To put a new picture on the
site, add the capture to the repository first (PR, merge, `npm run
cms:media -- --apply` uploads it), then pick it in the admin.

**The mirror.** After every request that changes what is live on a page
(publish, unpublish, restore from the trash, trash or permanent delete, and
the on-page visual-editing toolbar's publish), the Worker
(`src/cms/mirror.ts`, triggered by `src/cms/mirror-trigger.ts` after the
response is sent) reads the live pages and the Media Library from D1,
rebuilds `seed/seed.json` (every image as the `$media` reference a fresh
site sideloads) and the media manifest `seed/media.json` on top of
`main`, and through a GitHub fine-grained token scoped to this
repository pushes a `cms-edit/<timestamp>` branch and opens a PR titled
"CMS edit: …" with the `cms-edit` label, or adds a commit to the open one;
when live comes back to what `main` already holds, it closes the open
mirror PR instead. The token may push a branch and open, update or close a
PR; it never merges. The `CMS edit auto-merge` workflow arms auto-merge
(merge commit) for a PR that changes only `seed/seed.json` and
`seed/media.json`, and GitHub
merges it when the required checks are green, so the repository lags the
live site by minutes. A published edit that fails a truth test in
`tests/content.test.mjs` or `tests/media.test.mjs` leaves its PR open and
red: fix the wording or the picture in the admin (the next publish updates
the PR, or closes it when the fix restores what `main` holds) or change
the rule in that PR.

Two recorded limits: a scheduled publish fires from the cron, not from a
request, and is mirrored at the next admin action or by `npm run
cms:mirror`; a save that changes a published page's metadata without a
publish is not mirrored either, since the rendered pages use none of it.

**Never silent.** If the mirror fails for any reason (GitHub unreachable, a
token error, a database error), the Worker emails the maintainer through
Cloudflare Email Routing (`send_email` binding `MIRROR_EMAIL`, sender
`MIRROR_EMAIL_FROM`, recipient `MIRROR_EMAIL_TO`) with the page, the error
and the manual re-run below. The mirror runs only when both the GitHub
token and the email channel are configured, so a failure can always reach
you; until then (the gates below) it logs that it is unconfigured, names
what is missing, and does nothing else. The manual mirror is the safety
net in every case.

**Commands**, all read-only against the CMS except `cms:sync`:

| Command | What it does | Identity |
| --- | --- | --- |
| `npm run cms:mirror` | Writes the live CMS pages into `seed/seed.json` and the Media Library into `seed/media.json` on a throwaway worktree of `origin/main`, pushes `cms-edit/<timestamp>` and opens the labelled PR; `-- --no-pr` only rewrites the files here; `npm run cms:mirror:check` only reports (exit 1 when the repository is behind). Block types, collections, the approved captures and everything else stay as the repository says; a CMS schema that differs is reported. Every agent session starts with the check. | your Access login (below) |
| `npm run cms:check` / `npm run cms:sync` | Compares, or writes, the repository's block types into the CMS (a compatible change in place; a breaking one, such as a removed select option or the `screenshot` select replaced by the `image` field, as a new or reused activated version). Never writes page content. Run after a deploy that changes block types. | your Access login (below) |
| `npm run cms:media` / `npm run cms:media -- --apply` | Compares the Media Library with the approved captures of `seed/media.json` (matched by content hash: present or missing, alt text, dimensions) and each hero or feature slot of the live pages (a legacy `screenshot` slug awaiting its reference, an image that is not an approved capture, a reference the library no longer has, the dark pairing); `--apply` uploads the missing captures once with their alt text and dimensions (deduplicated, so a second run uploads nothing), writes the alt of an item that has none (never overwriting yours), connects the slots from the library (a legacy slug becomes the capture's light cut with its dark cut as the variant; an approved primary without its dark cut gets it) and publishes the page as you; a page with a pending draft is left alone and reported. Never deletes anything. | your Access login (below) |
| `npm run check:live` | After `npm run build`: renders both pages from the seed on local workerd, fetches them from the live site, resolves every Media Library file the live page renders to the capture `seed/media.json` records for it (so the manifest's `library` must be current in the checkout: run the mirror first), reports the live `data-content-source` (expected `cms`) and edge-cache status, and fails unless the two `<main>` elements are identical, which means the repository is behind the CMS or the mirror failed. | none (public pages) |

**Identity.** The scripts sign in as you through the Access login
`cloudflared` caches; no service token, no second Access policy, no EmDash
API token and no Worker secret is involved:

```sh
cloudflared access login https://repoglance.com/_emdash
```

opens the browser for your Google login once per Access session (24 hours
here). The scripts then read the cached JWT with `cloudflared access token`
and send it as `cf-access-token`; Access admits it and EmDash maps it to
your operator account, exactly as the admin tab does. The scripts never
print a token or header value.

**Agents.** Agents never publish. A machine identity (a Cloudflare Access
service token admitted by a Service Auth policy, carrying an EmDash API
token as Bearer) is admitted by `src/namespace-gate.ts` only to read
content and schema, to stage a draft on an existing entry against the
revision it read (the request must carry EmDash's `_rev`, so a stale write
answers 409 and the agent re-reads and redoes it; the write may carry only
`data`, `_rev`, `migrateBlocks` and `replaceBlocks`, never a status, since
EmDash treats a status on a save as live metadata and `status: "draft"`
would unpublish the page), to create a new entry as a draft, and to ask
for a preview link; publish, unpublish, schedule,
delete, schema writes, live metadata and every admin route answer 404. The agent hands you
the preview link and the admin link; you edit and publish. The identity for
this lane is a later slice with its own gates.

**Structure changes** (block types, components, the approved captures, new
fields) still ship from the repository: PR, merge, deploy, then `npm run
cms:sync` for block types and `npm run cms:media -- --apply` for the
captures. Never sync before the deploy.

### Gates for the Media Library (maintainer, one sitting)

The deploy of `media-library-014` replaces the `screenshot` select with the
`image` field, so between the deploy and the last step below the live
pages render no images (their blocks still carry the old slug and no
reference). Do the four in one sitting:

1. Deploy (below).
2. `cloudflared access login https://repoglance.com/_emdash`.
3. `npm run cms:sync`: the breaking block-type change (hero and feature get
   a new activated version with the `image` field).
4. `npm run cms:media -- --apply`: uploads the 25 approved captures with
   their alt text, connects the six slots from the old slugs and publishes
   both pages as you (which purges the edge), then re-checks. This is the
   one step of the migration that writes page content; it writes what the
   live blocks already said (the old slug) as library references, never
   copy from the seed, and only under your own login.
5. `npm run cms:mirror -- --no-pr`, so `seed/media.json` in your checkout
   records the library and the usage (the Worker mirror is dormant until
   the slice-2 gates of `cms-first-013`), then `npm run check:live`: both
   pages equal, live source `cms`. Commit the two rewritten files as the
   mirror PR (or run `npm run cms:mirror` from a clean checkout to open
   it).

Until step 4 `npm run cms:mirror:check` reports the pages as differing
(the old slug against the new reference); that is the migration, not an
admin edit.

### Gates for the mirror (maintainer, one sitting)

1. A GitHub fine-grained personal access token for this repository only,
   with **Contents: read and write** and **Pull requests: read and write**,
   set as the Worker secret from your own terminal and never printed:

   ```sh
   npx wrangler secret put GITHUB_MIRROR_TOKEN --name repoglance-site
   ```

2. Repository settings: **Allow auto-merge** on; a ruleset on `main` that
   **requires a pull request** before merging (the token has Contents write,
   so this is what keeps it from pushing to `main` directly) and requires the
   `Site checks` status (and, if you want, the workflow validation), so
   auto-merge waits for green.
3. Email: **Email Routing** enabled on the `repoglance.com` zone and the
   maintainer's mailbox verified as a destination address of the account.
   The `send_email` binding is declared in `wrangler.jsonc`; the recipient
   is a deploy-time var (`REPOGLANCE_MIRROR_EMAIL_TO` in the ignored
   `.local/deploy.env`, written into the config by `prepare:deploy`), never
   in source.
4. Deploy (below), then one real edit in the admin to prove publish, PR and
   auto-merge, and one forced failure (a wrong token) to prove the email.

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
6. After a deploy that changed block types: `npm run cms:sync`; one that
   changed the approved captures: `npm run cms:media -- --apply`. After any
   deploy: `npm run check:live` (the section above).
