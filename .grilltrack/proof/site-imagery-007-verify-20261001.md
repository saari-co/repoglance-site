# site-imagery-007 verification (2026-10-01)

The locked imagery (design.md v3) and the amended fourth home card
(site-copy-006) implemented in the real site on branch `claude/site-copy`
and verified on the production build of the head merged with `main`.

## Lock

Maintainer, 2026-10-01: imagery round 1 pick "C" with the sign-in code
screen on the "Before you sign in" card and the join hero, then "2" (lock
it, fix the card text) on the hybrid preview
(`imagery-hybrid-1-captures-20261001.md`). Dependencies: `site-look-005`
(the layout the images sit in) and `site-copy-006` (the copy around them,
reopened for the one card and re-locked). Both stay represented: the
captures below show the locked bands, slider, fact list and join-page
column, and every other sentence of the copy is byte-identical to the
copy lock.

## Implementation

Commit `53a2ede9950f6770b936bf274167496367326a4f`, then the merge of
`origin/main` (`0b48c9d`, hosting and CMS-access decisions kept, the
ledger replayed: main's decisions plus this branch's `site-copy-006` and
`site-imagery-007`, the event logs united in time order).

- `public/screenshots/`: thirteen slugs at 540 and 1080 px, cut from the
  RepoGlance `showcase-048` captures (dark set) by
  `.grilltrack/work/imagery-round-1/build-assets.py`; the Play listing's
  sample-mode files are gone (`owner-filter` removed, the six shared
  names replaced). `docs/content.md` records the source release, the
  source hashes and the crop boxes.
- `seed/seed.json`: the screenshot options are the thirteen slugs; the
  hero shows `home-widgets`, the cards `pinned-widget`, `catalog-rows`,
  `tile-row` and `signin-code`, the join hero `signin-code`; the
  `home-sample` block now reads "When you sign in" with the device-flow
  copy; every other string is unchanged.
- `src/content/screenshots.ts`: alt text and the 540 px dimensions per
  slug; `Screenshot.astro`: `data-shot` and per-slug width and height;
  `site.css`: the cut-out card image (280 px, cover from the top, 12 px
  corners, 16 px for widgets, left-aligned for the tile row, centred for
  phones).
- `AGENTS.md`, `docs/CHARTER.md`, `design.md` v3, `docs/content.md`: the
  imagery rule and sources (showcase captures with made-up data, never a
  live account, the sign-in code a fixture).
- `tests/content.test.mjs`: the screenshot test now checks each option's
  files, dimensions and an alt text that says the data is made up (or
  shows the sign-in screen), and that the fixture code stays out of the
  copy; `scripts/smoke.mjs`: the home page serves the showcase assets with
  such alt texts and the three cut-out card images.

## Verification

`npm run verify` in a fresh clone of `0b48c9d` (Node 22.23.2), exit 0:
audit 100 files (67 scanned), `astro check` 0 errors, 9 content tests
(EmDash `validateSeed` included) and 9 guard tests, the Cloudflare build,
67 smoke checks on local workerd with a fresh D1. The fresh clone is
deliberate: PRs #1 and #2 merged to `main` during this cycle, so the main
checkout above this nested worktree now carries a `tsconfig.json` without
`node_modules`, and Vite 8's resolver reads it from any worktree beneath
it ("Tsconfig not found astro/tsconfigs/strict"); CI checks out fresh and
is unaffected. The main checkout was not touched.

Full-page captures of that clone's `npm run build` served by `npm run
start` (local workerd, seed fallback) through Google Chrome's DevTools
protocol (`scripts/capture.mjs`, `FULL_PAGE=1`, 375x812 and 1280x900,
`prefers-color-scheme` emulation). Files are in the private asset release
[`repoglance-site-imagery-007-verify-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-imagery-007-verify-20261001)
of `saari-co/swarm-pr-assets`.

| File | SHA-256 |
| --- | --- |
| `index-dark-1280.png` | `da96c6c87428e0bc6b7d84a3a0aa831b41e9d8d2bb7287d96a9ca9b5290ee4b9` |
| `index-dark-375.png` | `eb3909b51e2ff7a61ed72dc202a6ad081fafbbe9f207456c697076320dd3524f` |
| `index-light-1280.png` | `0a07f8e2f28b4034590a11c380f6c1194cff746692a893561a05277e58630c31` |
| `index-light-375.png` | `6e247bd01cf0fb6620545cc5be8871d8923fde5c4f04274622fad9adcccc45c3` |
| `testers-dark-1280.png` | `5b701b0c12ff8f0020f7cfeea4585e0ef74465572ef1aec3ddf02d6c849c4e59` |
| `testers-dark-375.png` | `a9c347d74c791f8ebae66f3f31eae9bfdd643fa76fa4490bbf00fffa64bbac3c` |
| `testers-light-1280.png` | `bae9e07f2b10c9a0d1f77beb753e7e67a3005dffff02991e5ed65b36436c876c` |
| `testers-light-375.png` | `def548d5c2b42601f44149f7a72adc0c09e303ff6287d8aa5afa0eb5e308cc44` |

**Against the confirmed preview.** The four join-page files are
byte-identical to the hybrid preview captures in
`imagery-hybrid-1-captures-20261001.md` (`testers-*` share their SHA-256
with `h-testers-*`). The home page differs from the preview only where
the lock said it would: the fourth card's heading and body (the preview
still carried the sample-mode copy); inspected directly, the cut-outs,
the hero phone, the sign-in card and the join hero match the preview on
both widths and schemes, and no horizontal overflow at 375 px.

## Not proven here

As before: nothing is deployed; hosted behaviour, the Access allow path
and the CMS-backed render path are not exercised. The light-theme
showcase captures ship nowhere yet (kept in the source release for a
later scheme round).

## Review round 1

Exact-source review of the implementation commit
`53a2ede9950f6770b936bf274167496367326a4f` by a separate reviewer agent
(read-only, worktree only) against AGENTS.md, REPO_HYGIENE.md, the charter,
design.md v3 and the two locks. Source intent verified: the seed's slugs
equal the hybrid's, the only copy change is the fourth home card, all 26
WebP files hash-match the round-1 cuts and their manifest, the Play
captures are gone, `screenshots.ts` dimensions equal the files' headers,
the alt text is the hybrid's, only the intended files changed, no brand
assets added, the card copy's facts are in the README's Auth section (one
sentence is already in the locked fact list).

Findings and adjudication:

1. `REPO_HYGIENE.md` still said the screenshots are the Play listing's
   sample-mode captures, contradicting the new rule. **required_fix**:
   reworded to the showcase cuts.
2. `design.md` v3 counted "six phone frames and seven cut-outs" (it is
   seven and six) and the home-features bullet still described a
   top-cropped phone capture. **required_fix**: both corrected; the
   contract also now says an unused slug picked in the CMS renders with
   the generic card rule, since only the six slot assignments were
   previewed.
3. The seed's screenshot select fields were still labelled "sample mode
   only". **required_fix**: "Screenshot (showcase capture)".
4. `scripts/smoke.mjs` had dropped the old "no live" alt check and its
   sign-in alternative did not match the Connect screen's alt;
   `tests/content.test.mjs` accepted "live" beside "made-up".
   **required_fix**: both now reject "live" and the fixture code and
   accept the Connect screen's wording.
5. `docs/content.md` said every dark file was cut (the narrow tile
   captures were not) and its test-rule list lacked the two image rules.
   **required_fix**: reworded; the rules listed.
6. `design.md` v3 cited this proof before it was committed.
   **reject_false_positive**: the proof is written after verification and
   committed with the ledger, as in every cycle.
7. The round-1 proof's hashes of `build-assets.py` and `manifest.json`
   predate the `signin-code` regeneration. Recorded here instead: the
   shipped files were produced by `build-assets.py`
   `eec7985e194d49abcae1f99b2e373ac3d7373366336b6c027e95474051b8e58c`
   with `screenshots/manifest.json`
   `a510a661292b255a40065edccb537111a6b64ee0a80ac69b0b3cc5af84cb6239`
   and `alt.json`
   `ebaa9c65d2b3b993f7c3c58fabb19d83f3514f565a72692248e714bc43adc989`.

Notes without action: the ledger's focus domain read the reopened copy
decision after `reopen`; restated for the imagery cycle. Unused slugs get
the generic card rule (recorded in design.md).

Re-verification on `add4e6992eb859e22350069ecbadf145bb3a4645`: `npm run verify` exit 0 in the fresh
clone (audit 101 files, 68 scanned; 0 type errors; 9 content and 9 guard
tests; Cloudflare build; 67 smoke checks); the eight production captures
are byte-identical to the table above (the fix changed no image, slug or
rendered string). Re-review of `add4e6992eb859e22350069ecbadf145bb3a4645`: the five corrections match the
findings, nothing else changed; no further defects; recorded clean for
both decisions.
