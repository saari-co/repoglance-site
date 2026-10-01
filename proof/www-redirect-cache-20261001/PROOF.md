# www redirect and edge cache (2026-10-01)

Decision `www-redirect-and-cache-009`. The maintainer confirmed the proposal
on 2026-10-01 ("Confirmed, lock it and go ahead"): a permanent redirect from
`www.repoglance.com` to the apex, implemented in the Worker, and an edge cache
for the public pages through Astro's route cache with the Cloudflare
provider, which turns on Cloudflare's Workers Cache. No new Cloudflare
resource, KV namespace, token or dashboard rule is involved. The source
identity reviewed is named in the Review section below.

## Baseline, measured live before any change

`curl` from this Mac (Cloudflare colo MIA in `cf-ray`), 2026-10-01 about
15:37 UTC, `time_starttransfer` in seconds. The pages carried no
`cache-control`, `cf-cache-status`, `age`, `etag` or `vary` header.

| Request | Status | TTFB (6 samples) | Bytes |
| --- | --- | --- | --- |
| `GET https://repoglance.com/` | 200 | 0.327, 0.245, 0.236, 0.275, 1.408, 0.396 | 8200 |
| `GET https://repoglance.com/testers` | 200 | 0.283, 1.154, 0.236, 0.307, 0.250, 0.239 | 5634 |
| `GET https://www.repoglance.com/` | 200 (the page, canonical apex) | 0.189, 0.267, 0.214 | 8200 |

The network floor from the same vantage point: `/favicon.svg` and
`/robots.txt`, static assets served with `cf-cache-status: HIT`, answered in
0.19 to 0.29 s (one TLS handshake outlier at 0.98 s). `server-timing` on a
cold isolate showed about 390 ms inside EmDash's middleware (setup probe plus
runtime init, 8 to 9 D1 queries) against 25 ms of page render; on a warm
isolate the middleware reported 0 ms, so the per-request gain is modest and
the win is cold starts and D1 load. Live page bodies before the change, for
comparison after the deploy (the copy round may change them in between):
`/` `bf1be8d7…085af`, `/testers` `2a4be182…3ca739`, identical on both hosts.

## What changed

| File | Change |
| --- | --- |
| `src/host-canonical.ts` | pure host logic: normalise the host, recognise `www.repoglance.com` only, build the apex location, the bodiless 301 |
| `src/www-redirect.ts` | the redirect middleware |
| `src/outer-middleware.ts` | EmDash's `middleware.outer` entrypoint: `sequence(wwwRedirect, namespaceGuard)` |
| `src/page-cache.ts` | pure cache policy (`pages` tag plus EmDash's hint, `maxAge` 300, `swr` 60, `Vary: Host, Cookie`) and `applyPageResponse`, the response-level decision for a page |
| `src/content/load-page.ts` | the CMS-or-seed loader, moved out of the component; `preparePage` loads and applies the decision in the page frontmatter |
| `src/pages/index.astro`, `src/pages/testers.astro` | call `preparePage` and pass the page to the component |
| `src/components/ContentPage.astro` | rendering only |
| `astro.config.mjs` | `cache: { provider: cacheCloudflare() }`, outer middleware entrypoint |
| `wrangler.jsonc`, `worker-configuration.d.ts` | declares `cache.enabled` (the adapter writes it into the built config as well) and the `version_metadata` binding `CF_VERSION_METADATA`; types regenerated |
| `scripts/prepare-deploy.mjs` | prints the `cache` block and the version binding in its summary |
| `scripts/smoke.mjs` | 49 new checks (www 301s, cache headers with the version tag and the ETag, no-store on the namespace, the 404 page and the redirect, cookie variant) |
| `tests/host-canonical.test.mjs`, `tests/page-cache.test.mjs` | 12 unit tests (5 host, 7 cache policy and response), run by `npm run test:edge` inside `npm run verify` |
| `README.md`, `docs/cms-access.md`, `docs/getting-started.md` | the behaviour, the purge story, the local note |

Why the loader moved: Astro streams HTML, so a component's frontmatter runs
after the Response and its headers exist. `Astro.cache.set()` and
`Astro.response.headers` only take effect from the page frontmatter or
middleware. The first attempt set them in `ContentPage.astro` and the local
worker answered `no-store` with no `Vary`; moving them to the page fixed it.

## How it behaves

- `www.repoglance.com`: every request, `/_emdash` included (Cloudflare Access
  covers both hosts, the editor continues on the apex), answers a bodiless
  301 to the same path and query on `https://repoglance.com`. Any other host
  is served. The redirect runs before the namespace guard, so nothing is ever
  served from the www host, and the adapter marks the 301 no-store at the
  edge.
- A rendered public page answers
  `cloudflare-cdn-cache-control: public, max-age=300, stale-while-revalidate=60`,
  `cache-tag: pages,astro-path:<path>,astro-version:<worker version>` plus
  EmDash's entry tags when the CMS entry exists, `last-modified` (EmDash
  folds the build date in; for a CMS render the entry's own date wins when
  newer), `etag: W/"<worker version>:<last-modified ms>"`,
  `cache-control: no-cache` for browsers, and `vary: Host, Cookie`.
  Cloudflare strips `cloudflare-cdn-cache-control` and `cache-tag` before
  the client; `cache-control: no-cache` reaches the browser.
- A seed-rendered page (before CMS setup, or a CMS error) keeps EmDash's
  tags for purging but never inherits a retired entry's `lastModified`, so a
  browser's conditional request cannot keep a body the page no longer shows;
  the version-scoped ETag means the same across deploys.
- Everything else, the whole `/_emdash` namespace (the guard's 404 and
  EmDash's own opt-out), the site 404 page and the redirect, carries
  `cloudflare-cdn-cache-control: no-store`, the adapter's default once a
  cache provider is configured. The fail-closed guard therefore runs for
  every namespace request; the edge never answers one.
- Invalidation: EmDash's admin routes call Astro's `cache.invalidate` on
  every write that changes live content, with the entry and collection tags
  (a draft-only save does not purge; create and duplicate purge the
  collection tag, which every render carries). Evidence in
  `node_modules/emdash/dist/astro/routes/api/content/`: `_collection_/index.mjs`
  (create), `_collection_/_id_.mjs` (update, delete), `_id_/publish.mjs`,
  `_id_/unpublish.mjs`, `_id_/schedule.mjs`, `_id_/restore.mjs`,
  `_id_/discard-draft.mjs`, `_id_/duplicate.mjs`, `_id_/permanent.mjs`, each
  guarded by `if (cache?.enabled)`. The Cloudflare provider
  (`@astrojs/cloudflare/dist/cache/provider.js`) purges them with the Workers
  `cache.purge` binding from `cloudflare:workers` (no token, no binding
  declaration, free-tier purge rate limits).
- Per Cloudflare's Workers Cache documentation
  (`developers.cloudflare.com/workers/cache/cache-keys/` and
  `/workers/cache/configuration/`, read 2026-10-01): the key is the path, the
  query string and the Worker version (unless `cross_version_cache` is set),
  not the hostname; `Vary` creates a variant per listed request header value;
  `cloudflare-cdn-cache-control` has the highest precedence (the overview and
  limitations pages add that only `GET` and `HEAD` are cached). So a deploy
  starts cold, `Vary: Host` keeps the cached
  apex page from answering www requests ahead of the redirect, and
  `Vary: Cookie` keeps EmDash's cookie-driven edit mode on fresh renders
  (its middleware marks an edit-mode render `private, no-store` and opts out
  of the route cache). Anonymous visitors carry no cookie and share one
  entry. The five-minute TTL plus one minute stale-while-revalidate is the
  backstop if a purge fails.

## Verification

`npm run verify` exit 0 under Node 22.23.2 (`.nvmrc`) at the reviewed
commit: repository audit (91 files), Wrangler types, `astro check` 0 errors
on 28 files, 9 content, 9 guard and 12 edge unit tests, the Cloudflare
build, and the workerd smoke: **115 checks** against local workerd on a fresh
D1 (66 before this change, 49 new).

Fidelity note: the app-created worktree lives under a `.claude/worktrees/`
path, and there rolldown fails to resolve `extends: astro/tsconfigs/strict`
("Tsconfig not found") for `astro check` and, once the cache provider is
configured, for `astro build`; the untouched baseline already failed the
typecheck there. The same commits typecheck, build and smoke cleanly in a
detached worktree at a path without a dot-directory segment, which is where
every `verify` run in this packet was made. CI on the pull request is the
authoritative run.

Local header evidence (`wrangler dev --local` on the production build, fresh
D1, so the pages render from the seed; the version id is the local one):

| Request | Result |
| --- | --- |
| `GET /` | 200, `cache-control: no-cache`, `last-modified` (EmDash's folded build validator), `etag: W/"<version>:<ms>"`, `vary: Host, Cookie`, `cache-tag: pages,astro-path:/,astro-version:<version>`, `cloudflare-cdn-cache-control: public, max-age=300, stale-while-revalidate=60`, no `set-cookie` |
| `GET /testers` | same, `cache-tag: pages,astro-path:/testers,astro-version:<version>` |
| `GET /testers?x=1` with `Host: www.repoglance.com` | 301, `location: https://repoglance.com/testers?x=1`, `content-length: 0`, `cloudflare-cdn-cache-control: no-store` |
| `/`, `/_emdash/admin`, `/nothing-here` with the www host; `WWW.RepoGlance.com`, `www.repoglance.com:8787`, `www.repoglance.com.` | 301 to the apex path |
| `Host: repoglance.com`, `www.repoglance.com.evil.example`, `wwww.repoglance.com` | 200, served, no `location` |
| `GET /_emdash/admin` and the other ten namespace probes, forged JWT and cookie included | 404 `text/plain`, `cache-control: no-store`, `cloudflare-cdn-cache-control: no-store`, no redirect |
| `GET /nothing-here` | 404 site page, `cloudflare-cdn-cache-control: no-store` |
| `GET /` with `Cookie: CF_Authorization=forged; emdash-edit-mode=true` | 200 with the same edge policy and `vary: Host, Cookie`: a forged cookie gets the public render in its own variant; EmDash's real edit mode needs an Access identity and is not exercised locally |

`prepare:deploy` dry run with a placeholder id and both custom domains: the
summary shows `routes` for `repoglance.com` and `www.repoglance.com`, D1
`repoglance-site-cms`, R2 `repoglance-site-media`, `worker_loaders` true,
`cache: { enabled: true }` and `version_metadata: CF_VERSION_METADATA`; the
built `dist/server/wrangler.json` carries the same blocks and
`compatibility_date` 2026-09-29.

## Review

Round 1, an independent review bound to
`584726527a9c22d55fb7f1060f15106c8d8f2583` (standards and source intent, no
blockers), adjudicated as follows:

| Finding | Classification | Resolution |
| --- | --- | --- |
| A seed render after an unpublish inherited the retired entry's `lastModified`, so a browser's conditional request could keep the old body | required_fix | `applyPageResponse` folds the entry date in for CMS renders only; the `version_metadata` binding gives the provider a version-scoped ETag, so validators never match across deploys either; unit-tested |
| `preparePage` and its 404 branch had no unit test | required_fix | the decision is a pure `applyPageResponse`, tested with a fake context (found, seed, missing) |
| Version keying, the purge list and the edit-mode opt-out were asserted without evidence | required_fix (wording) and human_gate (live) | the Cloudflare pages are cited, the nine purge call sites are listed, the edit-mode sentence names its source and its limit; two live checks added below |
| `docs/cms-access.md` still said `ContentPage.astro` reads the CMS entry | required_fix | corrected |
| The smoke counts said 64 before and 49 new | required_fix | 66 before, 49 new after the two ETag checks, 115 total |

Round 2, bound to `885bc13cca6de6f00fa17849ab7e1254ee0ff8d0` (the single
squashed commit of this slice, PR saari-co/repoglance-site#4): clean, no
blockers, no should-fix; three wording nits (the purge sentence was
over-general about draft saves and the collection-only purges, the header
stripping sentence was ambiguous, the GET/HEAD clause was attributed to the
wrong page), applied in the ledger commit that records the review. The
reviewer confirmed that `applyPageResponse` is only reachable with a real
page, that dropping the seed render's validator regresses nothing (the
build-date fold still reaches the route cache; the smoke's ETag proves it),
that the `version_metadata` binding is a plain binding this Wrangler
understands, and the Cloudflare claims against the cited pages.

## Live (after the gated deploy)

Pending the maintainer's deploy OK. Planned checks, each with `curl`:
`cf-cache-status` MISS on the first request after the deploy, then HIT on
`/` and `/testers`, with TTFB before and after; `www` 301 after warming the
apex (proves the `Host` variant); a cookie-bearing request not served from
the anonymous entry (proves the `Cookie` variant); the anonymous
`/_emdash/admin` still 302 to Access on both hosts; a conditional `GET`
with the ETag; page body hashes against the baseline; and, if an editor
publishes, the page changing within seconds.

## Limits

- Cloudflare's Workers Cache is not emulated by local workerd: the smoke
  proves the headers and the redirect, the HIT itself is proven live only.
- `Vary: Host` is documented as honoured ("all header names are honored");
  the live www check after warming the apex is the proof. If it fails, the
  fallback is a zone Redirect Rule, a maintainer dashboard action.
- The purge on publish is EmDash's code path, exercised only by a real
  publish; without one the proven bound is the TTL.
- The Worker itself answers 200 to a conditional request (`If-None-Match`,
  `If-Modified-Since`): Astro emits the validators but does not answer 304.
  A 304 to a browser comes from Cloudflare's cache comparing the stored
  validators, which only the live check can show. HEAD mirrors GET.
- A seed-rendered page is cached with the same policy. Before CMS setup that
  is the shipped content; during a CMS error (the loader's catch) it means
  the seed fallback can be served for up to the TTL after D1 recovers, since
  no CMS write purges it.
- `Vary: Cookie` makes every distinct cookie string its own variant. The
  pages set no cookie (the smoke asserts it, the live baseline showed none),
  so anonymous visitors share one entry; if the zone ever sets cookies for
  anonymous visitors (Bot Fight Mode's `__cf_bm`, for example) the cache
  would fragment per visitor, which costs hits, not correctness.
- EmDash logs `[datetime migration] 0 noncanonical values (0 naive) using
  UTC` at error level on a fresh D1 during the smoke; informational and
  pre-existing.
