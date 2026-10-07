# CMS sync: the seed is the source, the CMS is kept equal to it (2026-10-07)

Decisions `cms-sync-011` and `emdash-upgrade-012` of the GrillTrack track
`gt-20261007120417-1b0a54`, the successor of the closed first track. Branch
`claude/cms-sync` from `main` at `e4e7be1`; the exact commit reviewed is
named in `.grilltrack/proof/cms-sync-011-verify-20261007.md`.

## What was decided

The maintainer chose option D of four on 2026-10-07: the seed stays the
only source of truth; `scripts/cms-sync.mjs` writes the seed's block types
and pages into the EmDash CMS through its API and publishes them, so the
CMS is the live source again and equal to the seed; `scripts/live-check.mjs`
proves the live pages equal a seed render. The sync runs as a maintainer
step right after every deploy, never on a merge, with the maintainer's own
Access login cached by `cloudflared`. The unattended service-token path is
documented in `docs/cms-access.md` and not built. The same day the
maintainer asked for EmDash 1.2, released that morning, so the slice was
built and verified on 1.2.0.

Facts behind the shape, verified in `node_modules/emdash/dist` (1.0.1 and
1.2.0 compared):

- EmDash's client and CLI accept a cloudflared-cached Access JWT as
  `cf-access-token`, so the maintainer's identity drives the API with no
  new Cloudflare resource. A service-token JWT carries no email (`sub` is
  empty, `common_name` is the client id), so the unattended path would need
  a Service Auth policy, a service token, an EmDash API token and a change
  to the namespace guard.
- EmDash treats a removed select option as a breaking block-type change
  (`allowed values changed`, breaking when a previous value is missing).
  The seed removed `owner-filter` on 2026-10-01, so the sync must create
  and activate a new version and migrate the blocks. The comparison is
  therefore modulo block `_version`.
- EmDash's seed engine (`applySeed` with `onConflict: "update"`) cannot
  apply a breaking change to an existing version and purges no edge cache,
  so an in-Worker self-sync was dropped.
- Writing the CMS before the Worker that renders the new seed is deployed
  would show new slugs with old components, so the trigger is the deploy
  runbook.

## What changed

| Area | Change |
| --- | --- |
| `package.json`, `package-lock.json`, `scripts/audit-repo.mjs` | `emdash` and `@emdash-cms/cloudflare` pinned to 1.2.0; the audit's pin follows. `overrides` pins `@codemirror/language` to 6.12.4: 6.13.0, published 2026-10-07 11:22 UTC, imports the new `@codemirror/streamparser` without declaring it and broke `astro build` through EmDash's admin bundle. New scripts `cms:check`, `cms:sync`, `check:live`. |
| `astro.config.mjs`, `src/page-cache.ts`, `src/content/load-page.ts`, `tests/page-cache.test.mjs` | The build time becomes the validator of a seed render. EmDash 1.1 (its PR 3528) folds its build date into a page's validator only when the page already carries one, so on 1.2.0 a seed render lost `Last-Modified`, the version-scoped weak `ETag` and `Cache-Control: no-cache`, which `www-redirect-and-cache-009` locked and the smoke asserts. A CMS render keeps the entry's own validator; the build time is its fallback. Two unit tests added, one extended. |
| `scripts/cms-sync.mjs` | `--check` (default, read only) and `--apply`; see "How the sync works". |
| `scripts/live-check.mjs` | Seed render of the local build on workerd versus the live `<main>`; see "The live check". |
| `scripts/lib/workerd.mjs`, `scripts/smoke.mjs` | The workerd start, readiness wait, log capture and shutdown moved into a helper shared by the smoke test and the live check; the smoke's 124 checks are unchanged. |
| `README.md`, `AGENTS.md`, `docs/cms-access.md`, `docs/content.md`, `docs/getting-started.md` | The live source and the sync model; the runbook section "Keeping the CMS equal to the seed"; the deploy step; the boundary that only the sync writes the CMS; the override note. |

### How the sync works

`node scripts/cms-sync.mjs [--check|--apply] [--url] [--seed] [--header]
[--override-lock] [--json]`, built on `emdash/client` (`EmDashClient`,
whose CSRF interceptor adds the `X-EmDash-Request: 1` header to every
mutation) and `emdash/client/cf-access` (custom headers).

Identity, in order: `EMDASH_TOKEN` (Bearer); EmDash's development bypass on
`localhost`/`127.0.0.1`; custom headers from `EMDASH_HEADERS` or `--header`
when they carry `CF-Access-Client-Id` or `cf-access-token`; otherwise the
JWT `cloudflared access token -app <origin>/_emdash` returns, sent as
`cf-access-token`, with the `cloudflared access login` command printed when
none is cached. No header or token value is ever printed.

Comparison, from `GET /schema/block-types/{slug}` and `GET
/content/pages/{slug}` (and the two list routes for extras): a block type's
`label`, `category`, `description`, `icon` and the canonical form of its
active version's fields (`slug`, `label`, `type`, `required` defaulting to
false, `defaultValue`, `validation`, `options`, keys sorted); a page's
`slug`, `status`, live data (`liveData` when a draft is pending, else
`data`) as `title`, `description` and `layout` with `_version` dropped, and
a pending draft that differs from the seed; block types or pages in the CMS
the seed does not declare. Exit 1 on any difference.

Apply, in order: block types (missing: `POST /schema/block-types`;
different: `PUT` with the active version's `expectedFingerprint` and only
the metadata that differs plus the seed's fields; on
`BLOCK_TYPE_BREAKING_CHANGE` the `PUT` is retried with `breaking: true`,
the inactive version whose fields equal the seed's is found, created by
EmDash or reused when one already holds them, and `POST
.../versions/{n}/activate` with the still-active fingerprint activates it);
then pages (missing: `POST /content/pages` as a draft; existing: `PUT` with
the seed's data, every block's `_version` set to the type's current
version, `migrateBlocks: true` and the entry's `_rev`); then `POST
.../publish` with the write's `_rev`; then a re-check. Nothing is ever
deleted; extras are reported.

### The live check

`node scripts/live-check.mjs [--live <origin>] [--path ...]` starts workerd
from `dist/server/wrangler.json` on a fresh throwaway state directory (a
seed render on an empty D1, as the smoke does), fetches `/` and `/testers`
there and from the live origin, reports the live `data-content-source`,
`cf-cache-status` and `age`, compares the two `<main>` elements byte for
byte, refetches once on a fresh cache key when a cache HIT differs, prints
the first difference with context, and writes both bodies and a
`summary.json` under ignored `runs/live-check-runs/<timestamp>/`. Exit 1 on
any difference.

## Verification (this Mac, Node 22.23.2 through mise)

`npm run verify` on the final tree: repository audit (151 files, 92
scanned), Wrangler types, `astro check` (0 errors, 0 warnings), content
tests 9/9, guard tests 11/11, edge tests 14/14 (the two new validator tests
included), the Cloudflare build, smoke 124/124 on local workerd. Before the
validator change, the same run on 1.2.0 failed exactly one smoke check,
`GET / carries a version-scoped weak ETag: etag null`, with
`last-modified` and `cache-control` absent as well; after it, all three
headers are back and every check passes. The refactored smoke was also run
alone (`npm run test:smoke`, 124/124).

Live check against repoglance.com (read only, 12:42 UTC), from the build
of this tree:

```
live-check: seed render from http://127.0.0.1:49771 (production build on an empty D1) against https://repoglance.com
  /: equal; live 200 from seed (cf-cache-status MISS); local 200 from seed
  /testers: equal; live 200 from seed (cf-cache-status MISS); local 200 from seed
Result: the live site equals the seed render on / and /testers.
```

The `<main>` of `/` is 6,635 bytes and of `/testers` 3,229 bytes on both
sides, so the live Worker (built from `main` before this branch) renders the
seed exactly as this tree's build does: the upgrade and the validator change
alter no markup.

Round trip on the development server (`npm run dev`, EmDash 1.2.0, a fresh
local D1, EmDash's development bypass as the identity), reproducing the
1 October drift and the recovery:

| Step | Command and result |
| --- | --- |
| 1 | `POST /_emdash/api/setup` with the seed's content: `seedComplete: true`; `/` renders `data-content-source="cms"`. |
| 2 | `cms-sync --check`: every block type and page `equal`, no extras; exit 0. The comparison matches EmDash's stored shapes after a plain setup. |
| 3 | `cms-sync --apply --seed .grilltrack/work/seed-20261001.json` (the seed of the hosting commit `c09c2ba`, byte-identical to the foundation's, which the 2026-10-01 setup imported): hero and feature reported as differing in the screenshot options and label; both pages differing in description and the copy of every block; applied as "breaking change, version 2 created and activated (was 1)" for both types, then both pages written and published; after: equal. `/` now shows the foundation heading "Your GitHub repos, at a glance, on your Pixel home screen." and the five foundation slots in order (`home-widgets`, `catalog-pinned`, `repository-issues-and-prs`, `quick-settings-tile`, `connect-or-explore-sample`), the state `proof/cms-drift-20261006/PROOF.md` recorded on the live site. |
| 4 | `cms-sync --check` against `seed/seed.json`: DRIFT, exit 1, naming the same differences in the other direction (the active version 2's options and label, every changed copy field, the slots). |
| 5 | `cms-sync --apply`: hero and feature "breaking change, version 1 reactivated" (EmDash reused the inactive version 1, which already held the seed's fields, instead of creating a third), both pages written and published; after: equal, exit 0. `/` renders `data-content-source="cms"`, the locked heading "Glance at the home screen. Know where your repos stand." and the five locked slots in order (`home-widgets`, `pinned-widget`, `catalog-rows`, `tile-row`, `signin-code`). |
| 6 | `cms-sync --check --json`: equal; active versions hero 1, feature 1, the four others 1; both pages `published`, no pending draft. |
| 7 | `live-check --live http://127.0.0.1:49758`: `/` and `/testers` equal, live from `cms`, local from `seed`, 6,635 and 3,229 bytes of `<main>` on both sides. The CMS render and the seed render of the production build are byte-identical inside `<main>`. |

A browser screenshot of the development server's home page after step 5
showed the locked hero copy (kept out of the repository; the `<main>`
equality in step 7 is the exact evidence).

## Limits

- The production CMS was not touched: no identity for it exists on this
  machine and the sync is the maintainer's step after the deploy. The
  production run will take the breaking path once (the 1 October version 1
  of `hero` and `feature` carries `owner-filter`; version 2 will be created
  and activated) and publish the two drafts.
- The round trip exercised the development bypass identity and the dev
  server's D1; the `cf-access-token` path was read in `node_modules/emdash`
  (`client/cf-access.mjs`, the CLI's `login`) and not executed, since
  executing it means signing in as the maintainer.
- Step 5's "reactivated" wording was added after the run (the run printed
  "created and activated" for the reused version); the behaviour was the
  same.
- `npm audit` reports advisories in EmDash's dependency tree that predate
  this change; none is in code this site serves to visitors.

## Maintainer gates after merge

1. Deploy (the runbook in `docs/cms-access.md`; the Worker applies two new
   core migrations on its first request).
2. `cloudflared access login https://repoglance.com/_emdash`.
3. `npm run cms:sync`, then `npm run check:live`.

## Deploy (2026-10-07 14:14 UTC)

On the maintainer's instruction ("merge #10, and deploy for me"):

- PR saari-co/repoglance-site#10 merged with a merge commit,
  `5d02a7323a1576671c3bf4752666bf9fbf49e44b`, after CI (three checks) was
  green and ClawSweeper's review of the exact head reported no findings
  and no security items ("ready for maintainer look", blocked only on the
  operational runbook).
- `main` at that commit built in this worktree with the Access team domain
  from the ignored deploy config of the sibling `repoglance-site-foundation`
  worktree (copied for the build and removed afterwards; nine server files
  reference the team domain, so the official Access auth and the guard are
  wired), `prepare:deploy` with both custom domains, the production D1 and
  R2 names, worker loaders, cache, version metadata and the daily cron,
  then `wrangler deploy`: Worker version
  `afc3e3fb-f7c6-46bc-a593-326cda098908`, 77 assets, triggers
  `repoglance.com`, `www.repoglance.com`, `schedule: 0 4 * * *`.

Live after the deploy (curl from this Mac):

| Request | Result |
| --- | --- |
| `GET /`, `GET /testers` | 200, `data-content-source="seed"`, the locked headings, `cache-control: no-cache`, `last-modified: Wed, 07 Oct 2026 14:14:32 GMT` (this build), `vary: Host, Cookie`; `cf-cache-status: MISS` then `HIT` on the next request |
| anonymous `GET /_emdash/admin` | 302 to the team's Access login |
| `GET https://www.repoglance.com/testers` | 301 to `https://repoglance.com/testers` |
| `npm run check:live` from the deployed build | both `<main>` equal, live source seed |

Two observations:

- The first `/testers` response after the deploy carried
  `last-modified: 11:55:42 GMT`, the previous Worker version's build time,
  from an edge that had not yet switched; a fresh render 20 seconds later
  and every request since report this build's time. The first `/` request
  also ran EmDash 1.2.0's two new core migrations (auto mode); both pages
  answered 200, not 503.
- No `etag` header reaches the browser from production, as
  `proof/www-redirect-cache-20261001/PROOF.md` already records (the edge
  strips it; the local build emits it). Not a regression of this change;
  the `Last-Modified` validator is live.

The CMS entries are still the unpublished 1 October drafts: the remaining
runbook steps are the maintainer's Access login, `npm run cms:sync` and
`npm run check:live`.

## Production sync (2026-10-07 14:26 UTC, maintainer)

The maintainer ran the runbook from this worktree at the deployed commit:
`cloudflared access login https://repoglance.com/_emdash` (the browser
returned the token to the Mac), `npm run cms:sync`, `npm run check:live`.
The sync's output, with no secrets in it:

- identity: cloudflared's cached Access login for the `_emdash` app.
- Before: `hero` and `feature` active version 1 differed from the seed in
  the screenshot field's label and options; both pages were `draft` (the
  seed says published), their live data differed from the seed in the
  description and the copy of every block, and each carried a pending
  draft that also differed; nothing extra in the CMS.
- Applying: `hero` and `feature` "breaking change, version 2 created and
  activated (was 1)"; `home` and `testers` "draft written from the seed
  (replaced a pending draft)" and "published".
- After: every block type and both pages `equal`, no extras; "Result:
  the CMS now equals the seed."

`check:live` right after: `/` and `/testers` equal, live 200 from `cms`
(`cf-cache-status MISS`, the publish purged the edge), local 200 from
seed. A fresh-key read a minute later (curl from this Mac): both pages
`data-content-source="cms"`, the locked headings, the five locked slots
on `/` in order and `signin-code` on `/testers`, `cache-control:
no-cache`, `last-modified` 14:27:00 and 14:27:02 GMT (the entries'
publish times, now the validator in place of the build time).

From here the live source is the CMS, equal to the seed; every later seed
change reaches the site through deploy, sync and live check. The
1 October data stays in the entries' revision history.
