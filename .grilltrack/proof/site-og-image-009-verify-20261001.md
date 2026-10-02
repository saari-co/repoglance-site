# og-image-009 verification (2026-10-01)

The locked Open Graph image (design.md v4, candidate C "Widget cut-out")
implemented in the real site on branch `claude/site-og-image` (from
`origin/main` at `b32f2ea341db0335bfe76ef95f77990823075671`) and
verified on the production build of the working tree that became the
implementation commit (the commit SHA is recorded in the ledger's
review entry and below once reviewed).

## Lock

Maintainer, 2026-10-01: "C looks to be my favorite so far", then "lock
C" on the round-1 picker (`og-round-1-captures-20261001.md`).
Dependencies: `site-look-005` (the band, the rings, the faces),
`site-copy-006` (the eyebrow and the hero line, read from the seed) and
`site-imagery-007` (the Pinned repos widget cut-out, the shipped
`pinned-widget-1080.webp`). All three stay represented: the image is
built only from their tokens, their words and their asset.

## Implementation

- `scripts/og-image/og-image.html`: the C page as a template, self-
  contained (the rings and the mark inline, the tokens in its own style),
  with two `data-seed` elements the script fills from the home hero in
  `seed/seed.json`; the widget is `public/screenshots/pinned-widget-1080.webp`
  cut to the header and three rows by a 420x262 px box with 26 px corners.
- `scripts/og-image.mjs`: headless Google Chrome through the DevTools
  protocol (the path `scripts/capture.mjs` already uses), 1200x630,
  device scale factor 1, `Page.setDocumentContent` with the filled
  template so relative assets resolve, a wait for `document.fonts.ready`
  and the image, `CSS.getPlatformFontsForNode` for the faces, then
  `public/og-image.png`; `--check` renders again and compares.
- `public/og-image.png`: 1200x630, 118269 bytes, SHA-256
  `b607c73c7e31157dc157066e8db4d544958a005b950302e462ba8574912cced1`,
  rendered on macOS with Google Chrome 154.0.8037.59; faces `.SF NS`
  (`.SFNS-Bold`) and `Menlo` (`Menlo-Regular`). `--check` right after:
  identical. The Play feature graphic (1024x500, sha256
  `68a0ffa5…58b1b8`) is gone.
- `src/layouts/Site.astro`: `og:image:type`, `og:image:width` 1200,
  `og:image:height` 630 and `og:image:alt` ("… three made-up
  repositories …") beside the existing `og:image`; nothing else changed.
- `scripts/smoke.mjs`: the home page declares the image, its size and a
  made-up-data alt; `/og-image.png` served by workerd equals the
  committed file byte for byte and is 1200x630.
- `tests/content.test.mjs`: the file is a 1200x630 PNG whose SHA-256
  equals the one `docs/content.md` records; the layout declares the size
  and an alt that says made-up with no fixture code.
- `docs/content.md` (the Open Graph section: pipeline, faces, hash, the
  rule in the test list) and `design.md` v4 (the lock, the rejected
  candidates, the proof references; the OG image leaves the unresolved
  list; scheme-matched page imagery is named there as still open).
- Two development fixes that rode along: `.claude/launch.json` gains
  `autoPort` and the `dev` script honours `PORT` (default 4321), because
  port 4321 on this machine belongs to another project's dev server.

## Verification

`npm run verify` on Node 22.23.2 (mise) in this worktree, exit 0
(`runs/verify-og-image-009.log`, ignored): audit 104 files (70 scanned),
`astro check` 0 errors, 10 content tests (EmDash `validateSeed`
included), 9 guard tests, the Cloudflare build, 69 smoke checks on local
workerd with a fresh D1 (three of them new: the declared image tags,
`/og-image.png` 200 `image/png`, the served bytes equal to the committed
1200x630 file). The nested worktree builds now that the main checkout
keeps its `node_modules`; no fresh clone was needed.

**Through the real meta tags with the real image.** The verified build
served by local workerd (`wrangler dev --local`, seed fallback): both
pages saved as `canvas/home.html` and `canvas/testers.html` under
ignored `.grilltrack/work/og-final/` (the round-1 picker engine with one
entry, `final`, and `out/final.png` = `public/og-image.png`;
`/og-image.png` fetched from workerd hashes
`b607c73c7e31157dc157066e8db4d544958a005b950302e462ba8574912cced1`,
equal to the committed file). The home canvas carries `og:image`,
`og:image:type`, `og:image:width`, `og:image:height` and `og:image:alt`
as implemented. Full-page captures via `scripts/capture.mjs`
(`FULL_PAGE=1`, 375x812 and 1280x900; the harness is light-only so the
dark duplicates were dropped) are in the private asset release
[`repoglance-site-og-image-009-verify-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-og-image-009-verify-20261001)
of `saari-co/swarm-pr-assets` with the image itself.

| File | SHA-256 |
| --- | --- |
| `og-image.png` | `b607c73c7e31157dc157066e8db4d544958a005b950302e462ba8574912cced1` |
| `final-home-light-1280.png` | `d6e36056f73ac7447367ea6dd0e675bdc414ee7a7dbeb82861bfbe74ef59ee12` |
| `final-home-light-375.png` | `3d34383ad924f062aa4d6d1796c4cb10d92beb1ed6784d3f33221341cdc4cc75` |
| `final-testers-light-1280.png` | `6e32438840e1e6d33566b2b3734028abe282bd1a90e6a743e7c6f2f209d08272` |
| `final-testers-light-375.png` | `6a63b9ac510d418226d6154fc94fc962f3278075bbabe5c364274e3570eeaca5` |

Harness files: `index.html`
`f4c11e22efe6d5ad6a3662fa1de698431d452dea7b6b7021cadb452b7ae0620b`,
`engine.js` `45d846e39358acb14425c62b1d4ea51520fff8dbcc2fb8c2d07f926fa145bfd9`,
`picker.css` `cf85720035adbb65640676fbbab0a1b24f63397f73578cf52e4685b5df90a3e5`,
`canvas/home.html`
`b8a268e192917d1ac3d1bad235cf5c0a7955baab298fc19338522ac318e0f6cc`,
`canvas/testers.html`
`15c758029af655ecb3d5fcd8b8baeb98cf4dffed52b657bede66175c50d08f2e`.

**Against the locked candidate.** Inspected directly: the committed image
beside round 1's `candidate-c.png`. Same composition, same positions,
same type; the only difference is the widget's source (the shipped lossy
WebP at 1080 px instead of the round's lossless crop), invisible at the
card sizes and faint at 1200 px. In the mimics the hero line and the
widget rows read in the Slack, Discord and X cards; the 2:1 crop keeps
everything; the square crops cut the words' start as in round 1.

## Not proven here

Nothing is deployed, so no real unfurl (Slack, Discord, X, iMessage) has
fetched the image; the card mimics are local approximations. The live
site renders from the CMS, whose entry still carries the pre-copy-lock
description; the og:image tags come from the layout, not the CMS, so
they change on deploy regardless. The generator is deterministic on this
machine (two renders identical) and will differ on a machine with other
faces or another Chrome build; the test pins the committed hash so such
a regeneration is a visible change.
