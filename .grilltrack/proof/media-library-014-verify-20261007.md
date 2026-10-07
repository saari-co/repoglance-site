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

- `npm run verify` on the final tree: audit 145 files, 111 scanned;
  `astro check` 0/0; `captures:check` 25; content and media 20/20; guard
  17/17; edge 15/15; CMS 23/23; build; smoke 172/172 on local workerd.
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

## Review

Recorded below per round with the exact source identity.
