# Media library: the pages' images as EmDash media references (2026-10-07)

Decision `media-library-014` of the GrillTrack track
`gt-20261007120417-1b0a54`, locked and confirmed by the maintainer on
2026-10-07 ("agree on all; lock it and spawn the session"), implemented in a
fresh session. Branch `claude/media-library-014` from
`origin/claude/media-library-014-lock` (`main` at `b40808e` plus the ledger
commit `f59c31a`); the exact commits reviewed are named in
`.grilltrack/proof/media-library-014-verify-20261007.md`.

## What was decided

EmDash's Media Library, grilled against WooCommerce's model: (1) the two
pages' pictures move into the library; the hero and feature block types
replace the `screenshot` select with an `image` field carrying a
`darkVariant`; the Open Graph image and the mark stay build products. (2)
Alt text lives on the media item with a render-time fallback to the block
heading; the imagery rules audit the library's alt. (3) Serving through the
Worker: the namespace guard admits the public media-file route and the
image endpoint, edge-cached like the pages; the image endpoint serves the
widths from one source per capture (the hand-cut 540 and 1080 px files
retire). (4) Import like WooCommerce's: a migration script uploads the
files once with their alt text, records each file's hash as the source and
skips files already present; the seed declares the same files as `$media`
so a fresh site sideloads them at bootstrap. (5) Any uploaded image may be
used on a page; the mirror writes a media manifest beside the seed and the
repository's tests judge it on the mirror PR. (6) `darkVariant` replaces
the `-light` file naming; the home hero's follows-the-band policy stays in
the component. (7) A block whose image reference is gone renders no figure
and the audit flags it. (8) Commerce follows the same pattern later.

The subject and crop of every slot are unchanged (`site-imagery-007`,
`site-scheme-imagery-010`); only the file mechanics moved.

## EmDash 1.2.0 facts behind the shape

Read in `node_modules/emdash/dist` and proven on the dev server:

- A seed `$media` reference is `{ "$media": { url, alt, filename?,
  caption? } }`. The resolver downloads it (SSRF rules: never a loopback
  or private host, so the seed cannot name the dev server) and stores the
  primary only: a nested `darkVariant` reference is dropped, and the
  created row carries no content hash. Setup spends at most five
  downloads per request and continues on the next call; a file two
  entries share can be downloaded twice (two rows, the same bytes).
- The block field `{ type: "image", options: { darkVariant: true } }` is
  the only field type with options; a stored value is `{ id, provider:
  "local", alt, width, height, filename, mimeType, meta: { storageKey },
  darkVariant }`. Block values validate strictly, so a migrated block must
  drop the removed `screenshot` key; activating a block-type version never
  rewrites entries.
- The public media-file route `/_emdash/api/media/file/<key>` needs no
  user; it refuses private keys and sends `Cache-Control: public,
  max-age=0, must-revalidate` with a weak ETag and Last-Modified. EmDash
  wraps the Cloudflare adapter's image endpoint: a media key is read from
  R2 and resized with the `IMAGES` binding (`?w=&h=&f=&q=`), everything
  else is delegated to the adapter's endpoint (the `ASSETS` binding for a
  same-origin path, an allowed remote otherwise). Miniflare's local Images
  binding resizes for real.
- The media API: multipart `POST /_emdash/api/media` (`file`, `alt`,
  `width`, `height`, `deduplicate`) deduplicates by `sha1:` content hash;
  `GET /_emdash/api/media` lists items with their hash, key and alt;
  `PUT /_emdash/api/media/{id}` writes alt and dimensions. `upload-url`
  is the signed-URL path, which R2 does not provide here.

## What changed

| Area | Change |
| --- | --- |
| `seed/seed.json` | `hero` and `feature` carry `image` (`type: image`, `options.darkVariant: true`, not required) in place of the `screenshot` select; the six slots are `$media` references to the repository's captures on `main` (`https://raw.githubusercontent.com/saari-co/repoglance-site/main/public/screenshots/<file>`), the light cut as the primary with its alt text and the dark cut as `darkVariant`. The seed still validates with `emdash/seed`. |
| `seed/media.json`, `scripts/approved-captures.mjs`, `scripts/lib/webp.mjs` | The media manifest: `approved` (the 25 captures: file, capture, scheme, width, height, size, SHA-256, EmDash content hash, alt; `npm run captures:check` in `verify` proves it equals the files, `--write` rewrites the facts and keeps the alt) and the mirror's `library` and `usage`. |
| `public/screenshots/` | One source per capture: `<capture>-dark.webp` and `<capture>-light.webp`, the former 1080 px cuts byte for byte (25 files); the 540 px cuts removed; `src/content/screenshots.ts` removed. The OG generator reads `pinned-widget-dark.webp` (same bytes, hash unchanged). |
| `src/content/media.ts` | Pure: the two value shapes, `resolveImageValue` (href, alt, dimensions, capture name), the endpoint URL and srcset builders, `publicMediaKey`, `matchesCapture` (content hash, else file name, size and dimensions for a seeded item). |
| `src/components/Screenshot.astro`, `Hero.astro`, `Feature.astro` | Render from the media reference: the same `<picture>` with one dark-scheme source, each candidate a 540 and 1080 px rendition through Astro's image endpoint, `width`/`height` from the source (the manifest for a seed reference), alt from the item with the heading fallback, `data-shot` from the capture's name so the card rules hold, `page`/`band`/`single` policies; no figure without a primary. |
| `astro.config.mjs` | `imageService: 'cloudflare-binding'` (nothing transformed at build; the site imports no images). |
| `src/namespace-gate.ts`, `src/emdash-namespace-guard.ts`, `src/page-cache.ts` | `publicMediaRead`: an anonymous GET or HEAD of the media-file route with a flat key, every candidate pathname already canonical, admitted before Access is consulted (`public-media`); `isImageEndpoint`; `applyMediaResponse` sets the page policy (five minutes fresh, one stale, tag `media`, Vary `Host`) on a 200 or 304 of either route after `next()`, keeping the route's validators; everything else unchanged. |
| `scripts/cms-media.mjs` (`npm run cms:media`, `--apply`) | The library against the approved captures by content hash (a hash-less seeded item verified by downloading its bytes): present or missing, alt empty or different, dimensions; each hero or feature slot: a legacy `screenshot` slug, an unapproved image, a reference the library lacks, the dark pairing. `--apply` uploads the missing files with alt and dimensions, writes an empty alt, connects legacy slots and pairings from the library (light primary, dark variant; the dark cut alone when no light exists), publishes the page as the maintainer; a page with a pending draft is reported and left alone. |
| `src/content/cms-shape.ts`, `src/cms/mirror.ts`, `src/cms/trigger-helpers.ts`, `src/cms/mirror-trigger.ts`, `scripts/cms-mirror.mjs`, `scripts/lib/cms-client.mjs` | A live media value becomes the seed's `$media` reference (file name and alt from the library); `pageDifferences` compares in that form, so an image swap is a content difference; `mirrorManifest` records the sorted library (no authors) and which block uses which item; the Worker mirror reads the library from D1 and commits the seed and the manifest together (either when it differs); the manual mirror does the same from the API. |
| `.github/workflows/cms-edit-automerge.yml` | A mirror PR may change `seed/seed.json` and `seed/media.json`, nothing else. |
| `scripts/live-check.mjs` | Resolves every media-file URL in the live `<main>` to the capture `seed/media.json` records for its key, then compares as before; an unrecorded key shows as a difference. |
| `scripts/smoke.mjs` | The pictures as endpoint renditions with the band and page policies and the source dimensions; no retired width and no media route in a seed render; the media route: an anonymous GET or HEAD reaches EmDash (404 JSON, uncached) while nine other forms and POST stay denied by the guard; a hero rendition is a resized WebP, edge-cached and tagged `media`; a foreign source answers 403; the static sources. |
| `tests/media.test.mjs`, `tests/content.test.mjs`, `tests/namespace-guard.test.mjs`, `tests/page-cache.test.mjs`, `tests/cms-shape.test.mjs`, `tests/cms-mirror.test.mjs`, `tests/cms-trigger.test.mjs` | The media module, the approved record against the files and `docs/content.md`, the library and usage audit (skipped while nothing is recorded), the seed's references and pairing, the gate's admission and refusals, the media policy, the conversion round trip, the two-file mirror, the D1 library reader. |
| `docs/content.md`, `docs/cms-access.md`, `README.md`, `design.md`, `AGENTS.md`, `docs/getting-started.md` | The approved captures and their hashes, the media route and the image service, the runbook (`cms:media`, the gates for the library), the imagery truth rule applied to what is live, the design note, the dev facts. |
| `scripts/capture.mjs` | The profile cleanup retries (Chrome may still be writing after the kill). |

## Verification (this Mac, Node 22.23.2 through mise)

`npm run verify` on the tree reviewed in round 1: repository audit (145
files, 111 scanned), Wrangler types, `astro check` 0 errors 0 warnings,
the approved-captures record (25 captures), content and media 20/20,
guard 17/17, edge 15/15, CMS 23/23, the Cloudflare build, smoke 172/172
on local workerd (the production build on an empty D1). On the tree after
the round-1 fixes: audit 147 files, 113 scanned; `astro check` 0/0;
captures 25; content and media 20/20; guard 18/18; edge 15/15; CMS
23/23; build; smoke 203/203 (the rendition fetched twice, seven refused
endpoint queries and a refused POST added). After the round-2 fixes:
audit 147/113; `astro check` 0/0; captures 25; content and media 20/20;
guard 19/19; edge 15/15; CMS 23/23; build; smoke 223/223 (twelve refused
endpoint queries).

### Local workerd (the production build, seed render)

Both pages render five and one `<picture>`; the hero follows the band
(`/_image?href=%2Fscreenshots%2Fhome-widgets-dark.webp&w=540&f=webp` as the
image, the light cut as the dark-scheme source), the cards and the join
hero follow the page; `width="1080" height="1920"` from the source. A
rendition at 540 px is a 17 500-byte WebP from the 45 466-byte source, at
1080 px 40 446 bytes, with `Cloudflare-CDN-Cache-Control: public,
max-age=300, stale-while-revalidate=60`, `Cache-Tag: media,…` and `Vary:
Host`. A GET or HEAD of `/_emdash/api/media/file/<key>` reaches EmDash (404 JSON
`NOT_FOUND`, no-store); POST there, `..`, an encoded slash, a nested
path, an empty key, the media list, an item, `upload-url` and the
upper-cased namespace answer the guard's 404. Since the round-1 fixes
the endpoint serves the site's own renditions to everyone: the same
rendition fetched twice answers the same bytes and policy, and another
width (`333`, `0540`, `5.4e2`), a reordered query, another format or
parameter, a capture the repository does not approve, a non-capture
path, a foreign source, the admin's thumbnail form without an operator,
a nested media key, an empty query and a POST answer the guard's
uncached 404 (before the fixes a foreign source answered the adapter's
403).

### Dev-server round trip (EmDash 1.2.0, `astro dev`, a fresh local D1 and R2)

For this run the seed's `$media` URLs pointed at this branch on GitHub
instead of `main` (the renamed captures are not on `main` until the
merge; the committed seed names `main`). The files were restored after
the run.

| Step | Result |
| --- | --- |
| 1 | Baseline: both pages from the seed (`data-content-source="seed"`), five and one pictures with both sources, every candidate a rendition of a repository capture. |
| 2 | `POST /_emdash/api/setup` (`includeContent: true`): two calls (the five-download budget): media created 5 then 1, content created 1 then 1, block types skipped 6; `seedComplete`. |
| 3 | The library (the API the admin's Media page lists): 6 ready items, the five light cuts the pages use plus `signin-code-light.webp` twice (shared by both pages, downloaded in both calls); alt text from the seed, dimensions measured by EmDash from the bytes; no content hash on any. |
| 4 | Both pages from the CMS (`data-content-source="cms"`), five and one pictures, every slot `data-scheme="single"` (the resolver dropped the dark variants), every image `/_image?href=%2F_emdash%2Fapi%2Fmedia%2Ffile%2F<key>.webp&w=540&f=webp`; each rendition 200 `image/webp`, a real WebP, with EmDash's weak ETag (`W/"<size>-<mtime>-w=540&f=webp"`) and Last-Modified. |
| 5 | `npm run cms:media -- --check --url …`: 20 captures missing, 5 present ("seeded by EmDash setup without a content hash; bytes verified"), the duplicate listed, six slots with their primary only; exit 1. |
| 6 | `npm run cms:media -- --apply --url …`: 20 uploads with alt and dimensions, `page testers: connected and published`, `page home: connected and published`; after: 25 present, six slots each with its dark variant; exit 0. A second `--check`: exit 0. |
| 7 | Both pages: every slot a `<picture>` with its dark source, the home hero `data-scheme="band"` (the dark cut as the image, the light cut as the dark-scheme source), the others `page`; 12 renditions 200 `image/webp` with validators. |
| 8 | The library: 26 ready items, the 20 uploads with `sha1:` hashes. |
| 9 | `npm run cms:mirror:check --url …` against the committed files: pages equal; the library and the six usage rows reported as not yet recorded; exit 1 ("behind"). |
| 10 | An admin-style swap through the API: the home page's first card set to the `catalog-pinned` pair with `_rev`, then `POST …/publish`. The dev log: `[cms-mirror] mirror not configured (GITHUB_MIRROR_TOKEN, MIRROR_EMAIL_TO missing): publish of pages/home was not mirrored` (the trigger fired, dormant as in production). |
| 11 | `cms:mirror:check`: `page home: content differs (layout[1].image.$media.alt, layout[1].image.$media.url, layout[1].image.darkVariant.$media.alt, layout[1].image.darkVariant.$media.url)` and `usage: home/home-pin.image now catalog-pinned-light.webp with dark variant catalog-pinned-dark.webp`. |
| 12 | `cms:mirror --no-pr`: `seed/seed.json` and `seed/media.json` rewritten; the seed's card carries the `catalog-pinned` references with the library's alt; the manifest's `library` holds 26 items (id, filename, type, size, dimensions, alt, content hash or null, storage key, status; no author) and `usage` six rows with ids and file names. `cms:mirror:check`: equal; exit 0. |
| 13 | The swap reverted through the API and published; the two files restored with git; `cms:mirror:check`: pages equal, library and usage unrecorded (as in step 9); `cms:media --check`: every capture present, every slot connected. |

### Captures (headless Chrome through DevTools, 375 and 1280 px, light and dark)

Three renders of both pages, under ignored `runs/media-library/`: the
current live site (`live`), the dev server after step 13 (`dev`, the CMS
render from Media Library files) and the production build's seed render
on local workerd (`seed`). Compared with Pillow, mean absolute difference
on the 0–255 scale and the share of pixels differing by more than 40:

| Capture | live vs dev | live vs seed | dev vs seed | pixels > 40 (dev vs live) |
| --- | --- | --- | --- | --- |
| index light 1280 | 0.18 | 0.18 | 0.00 | 0.01% |
| index light 375 | 0.19 | 0.19 | 0.00 | 0.00% |
| index dark 1280 | 0.19 | 0.19 | 0.00 | 0.00% |
| index dark 375 | 0.19 | 0.19 | 0.00 | 0.00% |
| testers light 1280 | 0.02 | 0.02 | 0.00 | 0.00% |
| testers light 375 | 0.05 | 0.05 | 0.00 | 0.00% |
| testers dark 1280 | 0.02 | 0.02 | 0.00 | 0.00% |
| testers dark 375 | 0.05 | 0.05 | 0.00 | 0.00% |

The CMS render and the seed render are identical. Both differ from the
live site only by the re-encoding of the renditions (the Images binding
re-encodes the WebP cuts at quality 85); every subject, crop, corner and
policy is the one the live site shows (inspected at 1280 light and 375
dark: the dark home-screen phone on the ink band, the light one on the
near-white band, the cut-outs on the cards).

## Fidelity gaps and limits

- The admin's own Media page was not screenshotted: on the dev server the
  admin's sign-in redirects to the configured `siteUrl` (the live site's
  Access login), so the library was listed through the same API the page
  reads (`GET /_emdash/api/media`), and `cms:media` reads it the same way.
- The dev round trip ran with the seed's `$media` URLs pointing at this
  branch; the mechanism is the same and the committed seed names `main`,
  where the files exist after the merge. A bootstrap from a build that is
  not `main` would sideload `main`'s captures.
- In `astro dev` the route cache is off, so a dev rendition shows
  `Cloudflare-CDN-Cache-Control: no-store`; the production build on
  workerd shows the page policy (the smoke asserts it).
- The lock counts 26 files; the repository has 25 (`repository-prs` has
  no light capture in the release), the number `docs/content.md` has
  recorded since `site-scheme-imagery-010`.
- The seed declares the captures the pages use (ten files, twelve
  references), not all 25: EmDash's seed format has no media section, a
  `$media` reference resolves only inside content. The other fifteen
  enter the library through `npm run cms:media -- --apply`, which the
  confirmed runbook already names.
- A media item deleted in the admin after a page referenced it keeps the
  page's stored reference (file name and storage key stay in the value),
  so the page renders a `<picture>` whose renditions answer 404 until the
  page is edited; the audit sees it at that page's next publish, since a
  media write is not a mirror trigger. Recorded in `docs/content.md`;
  extending the trigger to media writes is a follow-up.
- `/_image` serves the site's own renditions to everyone: an approved
  capture or a library file at 540 or 1080 px as WebP, spelled exactly as
  the pages emit it (keys in order, the pages' encoding; `0540`, `5.4e2`
  and a reordered query are refused, so one rendition is one cache key);
  anything else is served uncached only to an operator Access admits (the
  admin's Media gallery asks the endpoint for 400 px thumbnails of
  library files, authenticated through the Access session cookie since
  the endpoint lies outside the application's path, so the application's
  cookie path attribute stays off; an anonymous request answers the
  guard's 404 before the adapter transforms anything, where it would
  otherwise transform any allowed source at any size). EmDash's middleware already returns a
  fresh copy of every response, so the immutable-headers failure round 1
  feared cannot occur; the guard's own copy of a rendition stays as a
  second, defensive one, and the smoke fetches a rendition twice.
- A seeded media row has no content hash (EmDash); the audit and the
  scripts match such an item by file name, size and dimensions, and
  `cms:media` verifies its bytes. A capture two pages share is downloaded
  twice at setup (two ids, the same bytes); harmless and listed.
- The deploy replaces the `screenshot` select with the `image` field, so
  between the deploy and `npm run cms:media -- --apply` the live pages
  render no images (their blocks still carry the old slug); the runbook
  asks for the four steps in one sitting. Until then `cms:mirror:check`
  reports the pages as differing (the migration, not an edit).
- A rendition of a repository capture (the seed render) carries the
  adapter's `Cache-Control: public, max-age=31536000, immutable` and no
  validator; the live site renders library files, whose renditions carry
  EmDash's `max-age=0, must-revalidate` and validators. At the edge both
  are cached five minutes; EmDash's media writes do not purge the `media`
  tag, so a replaced original is stale at the edge for at most that
  window. An approved capture missing from a deploy (or a stranger an
  operator asks for by hand) answers 500 through `/_image` (the
  adapter), uncached; an anonymous request for a name the repository does
  not approve answers the guard's 404.
- `cms:media --apply` connects the slots and publishes the pages under
  the maintainer's own identity, the one step of the migration that
  writes page content: what the live blocks already said (the old slug)
  becomes library references; never copy from the seed, never a
  deletion, and a page with a pending draft is left alone. The lock's
  letter scopes the script to the uploads; the confirmed runbook
  (`cms:media -- --apply` then `check:live`) needs the pages connected,
  which is why the script does it. Whether to keep that or to stage the
  connection as a draft the maintainer publishes in the admin is the
  maintainer's call (review finding 3).
- Production is untouched: no upload, no sync, no deploy.

## Maintainer gates (after the merge, one sitting)

In `docs/cms-access.md`, "Gates for the Media Library": deploy;
`cloudflared access login https://repoglance.com/_emdash`; `npm run
cms:sync` (the breaking block-type change); `npm run cms:media -- --apply`
(the 25 uploads, the six slots connected and published); `npm run
cms:mirror -- --no-pr` so the checkout's `seed/media.json` records the
library and the usage, then `npm run check:live` (it resolves the live
media files through that record), then the two files as the mirror PR.
The slice-2 gates of `cms-first-013` are unaffected.
