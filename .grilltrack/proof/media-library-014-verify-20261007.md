# media-library-014: verification and review (2026-10-07)

Track `gt-20261007120417-1b0a54`. Full packet:
`proof/media-library-20261007/PROOF.md`.

## Lock

`media-library-014` (maintainer, 2026-10-07, grilled against WooCommerce):
EmDash's Media Library owns the pages' pictures; the hero and feature block
types carry an `image` field with a `darkVariant` in place of the
`screenshot` select; alt text on the media item with the heading as the
fallback; the namespace guard admits the public media-file route and the
image endpoint, edge-cached like the pages; one source per capture served
at every width by the image endpoint; a migration script imports the
captures once by hash with their alt text and the seed declares them as
`$media`; the mirror writes a media manifest the tests judge; a block whose
reference is gone renders no figure. Confirmed summary points (1) to (7)
implemented; (8) is the pattern commerce follows later.

Prior locks kept: `site-imagery-007` and `site-scheme-imagery-010` (the
subject and crop of every slot, the band policy on the home hero, the card
rules keyed by the capture's name; captures compared with the live site:
identical but for re-encoding), `site-copy-006` (the seed's copy
untouched), `og-image-009` (the same bytes under the new file name, hash
unchanged), `www-redirect-and-cache-009` (the pages' policy unchanged;
media added with the same TTLs), `cms-access-008` and `cms-first-013`
(Access-only editor; one anonymous read admitted, the media file; the
mirror gains a second file and the machine rules are unchanged),
`emdash-upgrade-012` (1.2.0).

## Implementation refs

- `seed/seed.json`, `seed/media.json`, `public/screenshots/` (25 files),
  `scripts/approved-captures.mjs`, `scripts/lib/webp.mjs`
- `src/content/media.ts`, `src/components/Screenshot.astro`,
  `src/components/Hero.astro`, `src/components/Feature.astro`,
  `astro.config.mjs`
- `src/namespace-gate.ts`, `src/emdash-namespace-guard.ts`,
  `src/page-cache.ts`
- `scripts/cms-media.mjs`, `scripts/cms-mirror.mjs`,
  `scripts/lib/cms-client.mjs`, `scripts/live-check.mjs`,
  `scripts/smoke.mjs`, `scripts/capture.mjs`, `scripts/og-image/og-image.html`
- `src/content/cms-shape.ts`, `src/cms/mirror.ts`,
  `src/cms/trigger-helpers.ts`, `src/cms/mirror-trigger.ts`,
  `.github/workflows/cms-edit-automerge.yml`
- `tests/media.test.mjs`, `tests/content.test.mjs`,
  `tests/namespace-guard.test.mjs`, `tests/page-cache.test.mjs`,
  `tests/cms-shape.test.mjs`, `tests/cms-mirror.test.mjs`,
  `tests/cms-trigger.test.mjs`, `package.json`
- `docs/content.md`, `docs/cms-access.md`, `docs/getting-started.md`,
  `README.md`, `design.md`, `AGENTS.md`

## Verification refs

- `npm run verify` on the round-1 tree: audit 145 files, 111 scanned;
  `astro check` 0/0; `captures:check` 25; content and media 20/20; guard
  17/17; edge 15/15; CMS 23/23; build; smoke 172/172 on local workerd.
  After the round-1 fixes: audit 147/113; `astro check` 0/0; captures 25;
  content and media 20/20; guard 18/18; edge 15/15; CMS 23/23; build;
  smoke 203/203. After the round-2 fixes: audit 147/113; `astro check`
  0/0; captures 25; content and media 20/20; guard 19/19; edge 15/15;
  CMS 23/23; build; smoke 223/223.
- Local workerd probe of the production build (the packet): renditions,
  the edge policy and tag, the guard's admissions and refusals.
- Dev-server round trip (the packet's table): setup from the seed with
  `$media` in two calls, the library listed through the API, both pages
  from media references (primaries after setup, both sources after
  `cms:media --apply`), `cms:media --check` and `--apply`, an admin-style
  swap reported and mirrored into `seed/seed.json` and `seed/media.json`,
  the swap reverted.
- Captures of both pages at 375 and 1280 px in both schemes: the CMS
  render equals the seed render pixel for pixel; both equal the live site
  but for re-encoding (mean difference 0.02 to 0.19 of 255; at most 0.01%
  of pixels differ by more than 40).

## Review round 1

Source identity: `git:da5905f9577dd0f514b1df47274e22f844282e81` (the
implementation commit `2095760` plus the round-trip fixes, proof and
ledger records; parent `f59c31a`, the lock commit on `main` `b40808e`). A
separate read-only agent reviewed the diff and the full new files against
AGENTS.md, REPO_HYGIENE.md, the charter, design.md, EmDash 1.2.0's,
`@astrojs/cloudflare` 14.3.3's and Astro 7.3.5's dist sources and the
confirmed decision, ran the content, guard, edge and CMS suites and
`node --check` on every changed script. Adjudication by the implementer:

| # | Finding | Classification | Resolution |
| --- | --- | --- | --- |
| 1 | The image endpoint's cached-response path: a hit in the adapter's Cache API returns a Response with immutable headers (Workers), and `applyMediaResponse` then lets Astro's route cache write headers on it, which throws; the first request (a miss) works, a later one in the same colo fails. Not reproduced on local workerd (three fetches, three 200s), but the reasoning holds for production. | required_fix | The guard copies a served rendition into a fresh Response before the policy applies; the smoke fetches the same rendition twice and expects the same answer. |
| 2 | The runbook ran `check:live` before the mirror, but `live-check` resolves live media files through `seed/media.json`'s `library`, empty until a mirror has recorded it, so step 5 would fail on every image. | required_fix (docs) | The gates now run `npm run cms:mirror -- --no-pr` first, then `check:live`, then the two files as the mirror PR; the `check:live` row names the dependency; the packet's gate list follows. |
| 3 | `cms:media --apply` connects the slots and publishes both pages under the maintainer's identity; the lock's letter scopes the script to uploads, alt and the source hash, and the contract says a human edits and publishes in the admin. It is not a seed-to-CMS copy write (the connection derives from the live block's old slug plus the library) and a machine identity cannot publish, but it is material behaviour beyond the lock. | human_gate | Kept, because the confirmed runbook (`cms:media -- --apply` then `check:live`) needs the pages connected; AGENTS.md, the runbook and the packet now say so in those words. The maintainer decides whether to keep it or to have `--connect` stage a draft they publish in the admin. |
| 4 | `docs/cms-access.md` still said the auto-merge workflow arms a PR that changes only `seed/seed.json`. | required_fix (docs) | Says `seed/seed.json` and `seed/media.json`. |
| 5 | The seed declares the captures the pages use (ten files, twelve references), not all 25; the EmDash seed format has no media section. The packet did not name the deviation from points (1) and (4). | defer (recorded) | Named in `docs/content.md` and the packet's limits; the other fifteen enter through `cms:media`, which the runbook already names. |
| 6 | Point (7) holds only when the value lacks a storage key: a media item deleted after being referenced keeps the stored value, so the page renders a picture whose renditions answer 404, and the audit sees it only at the next page publish (no media-route trigger). | defer (recorded) | Said in `docs/content.md` and the packet; extending the mirror trigger to media writes is a follow-up. |
| 7 | `applyMediaResponse` ran after EmDash's own opt-out and re-enabled the cache for a signed-in user or a private/no-store response (harmless for the media routes, but against EmDash's intent). | required_fix (reviewer: defer; taken) | The policy is skipped for a signed-in user and for a response whose Cache-Control says private or no-store; tested. |
| 8 | "Every slot filled" in the audit and in `cms:media`'s exit code is stricter than point (7), since the field is deliberately not required. | reject_false_positive | Point (7) says "a block whose image reference is gone renders no figure and the audit flags it": the audit flagging an empty slot is the lock; the field stays optional so the site renders. Documented as intended. |
| 9 | With `cloudflare-binding`, `/_image` accepted the adapter's whole parameter space (any allowed source, any width up to 4000, `h`, `q`, `fit`), each a separate edge entry and an Images transform. | required_fix (reviewer: defer; taken) | The guard serves only the site's own renditions (a repository capture or a library file, 540 or 1080 px, WebP, nothing else in the query); anything else answers the guard's uncached 404 before the endpoint runs; unit-tested and in the smoke. |
| 10 | Between the deploy and `cms:media --apply` the live pages render no images; a transitional read of the old slug was suggested. | defer | Documented; the runbook asks for the four steps in one sitting; a transitional read would add code that must be removed again. |
| 11 | `describeChange` compared without the manifest's `base`, so a non-default base on `main` would list every image as a difference in the PR body. | required_fix (reviewer: defer; taken) | The PR body's differences use `media.before.base`. |
| 12 | The packet said the seeded items' dimensions came from the seed; EmDash measures them from the downloaded bytes. | required_fix (wording; reviewer: defer) | Reworded. |

Checked and found clean by the reviewer: the gate's admission (GET or
HEAD of a flat key, every candidate already canonical; encoded slash,
`..`, doubled slash, uppercase namespace, the media list, an item,
`upload-url`, assets all denied before Access; the machine path and the
denied response unchanged; the www redirect first); the EmDash facts
against the dist (the file route, its headers and 304s, the wrapper, the
foreign-href 403, `options.darkVariant` on image fields only, the seed
resolver's primary-only result and missing hash, the normalizer filling
`filename`/`mimeType` so `data-shot` and the card CSS hold, the media API
shapes, the D1 columns, `_rev` on publish, the `IMAGES` binding); the
components' policies, alt fallback, no figure without a primary, source
dimensions, the home hero's band policy; the mirror's two files committed
only when they differ, the empty manifest when `main` has none,
`approved` preserved, the sorted library without authors, the usage
rows, the closed/equal/updated paths, the workflow filter; the scripts'
hash dedupe, byte verification, alt never overwritten, pending drafts
skipped, the WebP header layouts, the smoke matching the component's
output; the tests; the standards (no credentials or identifiers, no
`@dinkuskit`, native `Blocks`, prior locks preserved: the same captures
byte for byte under new names, the OG image's bytes, the pages' cache
policy, no seed-to-CMS copy write, agents cannot publish; 25 against 26
explained; `SEED_MEDIA_BASE` sound; ledger and events consistent).

Ledger: `media-library-014` reviewed with findings (required_fix, defer,
human_gate, reject_false_positive) at `git:da5905f9…`, returned to
implementation; round 2 below.

## Review round 2

Source identity: `git:6e94bc1370d26c9848a2d3189aaacf5126d519d1` (the
round-1 fix commit; parent `da5905f`). A separate read-only agent
verified each round-1 resolution against the diff, probed the endpoint
parsers (`Number.parseInt` in the adapter, `/^\d+$/` in EmDash) and the
admin bundle, read EmDash's `finalizeResponse` and Astro's cache header
application, ran the four suites and `node --check`. Findings and
adjudication:

| # | Finding | Classification | Resolution |
| --- | --- | --- | --- |
| 1 | `isSiteRendition` compared the width with `Number()`, so `w=5.4e2`, `0540`, `+540`, `0x21c` passed the guard while the adapter rendered 5, 540, 540 or 0 px and EmDash's wrapper streamed the full original (then edge-cached); "only 540 or 1080 px" was not true. | required_fix | The width is matched as the exact string `540` or `1080`; the whole query must be spelled exactly as the pages emit it (keys `href`, `w`, `f` in order, the pages' encoding), so one rendition is one cache key; unit tests for `0540`, `5.4e2`, `0x21c`, `+540`, `540.0`, a leading space, a reordered query, a raw or lower-case-encoded slash and a trailing `&`; the smoke refuses `0540`, `5.4e2` and a reordered query. |
| 2 | Round 1's row 1 was a false positive: EmDash's `finalizeResponse` already returns `new Response(response.body, response)` on every path, the image route included, between the guard and the route, so Astro's route cache never writes on an immutable response; the guard's copy is harmless but the record, the guard's comment, the runbook and the packet attributed the mechanism to the guard. | required_fix (record and docs); round-1 row 1 reclassified reject_false_positive in substance | Reworded everywhere: EmDash's copy is the mechanism, the guard's copy a second, defensive one. The round-1 ledger record stands as recorded (a `required_fix` was taken); this round records the correction. |
| 3 | The deny refused the admin's own Media gallery: it asks the endpoint for 400 px thumbnails of library files (`href` absolute with `?_emdash_media=`, `w=400`), fell back to the full-size originals on error, and the page worked but loaded every file whole. | required_fix (reviewer: docs required, code deferred; the code taken) | `evaluateImageRequest`: a site rendition is public and cached; anything else is served, uncached, to an operator Access admits (the official authentication, the allowlist) and answers 404 to everyone else; machines and non-GET denied. In development everything passes. Unit-tested (rendition without Access, thumbnail with and without an operator, the allowlist, dev, POST); the smoke refuses the thumbnail form anonymously; the runbook and the packet say so. |
| 4 | Every spelling of one rendition was a distinct cache key, transform and edge entry (`0540`, `540.0`, `%2f`, a reordered query, a trailing `&`). | required_fix (reviewer: defer; taken with 1) | The exact-spelling rule above; the order-insensitive test case flipped to refused. |
| 5 | `CAPTURE_FILE` admitted any `/screenshots/<name>.webp`; a missing name cost an `ASSETS` fetch and a failing Images call (500) per request. | required_fix (reviewer: defer; taken) | The guard passes the approved captures from `seed/media.json`; a repository rendition must name one; a stranger answers 404 (smoke). |
| 6 | The `describeChange` base fix had no test. | required_fix (note; taken) | A test rebases the hero's references to another base and asserts the PR body lists no page difference. |

Checked and found clean by the reviewer: the diff's fourteen files all
accounted for; the ledger and events consistent; `isSiteRendition`
otherwise refusing repeated keys, a `href` with query or fragment,
uppercase, `%252F`, `..`, `+`, empty values, remote and same-host
absolute hrefs; the pages emitting exactly admitted URLs and the smoke
proving both widths and the repeated fetch; the fresh copy preserving
status, headers and null bodies for 304 and HEAD and leaving the
adapter's `cache.put` tee alone; `applyMediaResponse`'s regex identical
to EmDash's and the normal media responses still cached; `locals.user`
set by the inner auth middleware on the image route; the base passed as
on the write path; the runbook's bullets, rows, gates and the auto-merge
sentence; AGENTS.md matching the script; `docs/content.md`'s counts; the
packet's figures; the smoke and tests asserting what the code does; no
site path emitting another endpoint width; EmDash's redirect middleware
skipping the endpoint and the toolbar not requesting it.

Ledger: `media-library-014` reviewed with findings (required_fix,
reject_false_positive) at `git:6e94bc13…`, returned to implementation;
round 3 below.
