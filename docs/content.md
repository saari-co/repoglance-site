# Content sources

Every claim about the app and the test in `seed/seed.json` traces to one
of:

- `saari-co/RepoGlance` `README.md` on `main` (the "Available on main" list
  and the "Not available yet" list),
- `saari-co/RepoGlance` `docs/store-listing.md` (Play copy for
  0.4.0-beta.1),
- `saari-co/RepoGlance` `proof/play-console-20260930/PROOF.md` (closed test
  state, the Google Group and its "Anyone on the web can join" setting, no
  opt-in link yet, the bundle's API levels 31+, which is "Android 12 or
  newer").

Two housekeeping sentences on the join page describe the signup itself
rather than the app ("the rest takes a few minutes", "Leaving the group
leaves the test") and have no upstream source.

`tests/content.test.mjs` enforces the rules that follow from those sources:
no "stack" as a widget name, CI mentioned only as "not yet" or "does not
fetch", no watched-run notification or production-release claim,
"read-only" and "never changes anything on GitHub" present, the build
version named, the privacy, Google Group, repository and issues links
present, no Play opt-in URL; and for the images, every screenshot option
shipped at both widths with dimensions and an alt text that says the data
is made up (or shows the sign-in screen), never "live", and the fixture
code kept out of the copy and the alt text; and for the Open Graph image,
a 1200x630 PNG whose hash this file records, declared with its size and a
made-up-data alt in `src/layouts/Site.astro`.

The wording was decided in GrillTrack `site-copy-006` (2026-10-01): one
five-candidate round on the real pages and a confirmed hybrid
(`.grilltrack/proof/copy-round-1-captures-20261001.md`,
`copy-hybrid-1-captures-20261001.md`); `design.md` v2 records the voice.
The hero heading on `/` is also asserted by `scripts/smoke.mjs`, so change
the seed and that check together.

## Screenshots

Every image under `public/screenshots/` is a cut of a RepoGlance showcase
capture (GrillTrack `site-imagery-007`; the app's `showcase-048`): sample
mode rendered without its marker under the fictional owners
`saltmarsh-io`, `ferrywood` and `elin-tidewater` (each a 404 on GitHub on
2026-10-01), on the approved emulator (AVD `Pixel_10_Pro_Fold`, API 36)
cover display at 1080x2364, SystemUI demo clock at 9:30 with the device
clock set to match, dark theme. No capture shows a real account, no screen
says sample, and the sign-in screen shows the fixture code `HK7N-4R2D`
from the app's debug-only preview, never a GitHub-issued code. The
captures are in the private asset release
`saari-co/swarm-pr-assets` `repoglance-showcase-048-20261001`; the app's
proof is `.grilltrack/proof/showcase-048-verify-20261001.md` in
`saari-co/RepoGlance` (the two `signin-code` files are recorded in this
repository's `imagery-hybrid-1-captures-20261001.md`). Source SHA-256s:
the dark files except the narrow tile captures are the ones cut; the
light files and the narrow tile captures are kept for a later round:

| Source file | SHA-256 |
| --- | --- |
| `catalog-pinned-dark.png` | `2edb8e348ba6e2d7bd5c315a8addde2de8a3ab8b886151e9a45228f56582ab25` |
| `catalog-pinned-light.png` | `370c54774d82f2ff64c3f70077940e44ba4e2c64bcaa95f6268da21fc89b3243` |
| `connect-dark.png` | `fc44d77fc2d1e977a104b11b1b9c82bff76da79818e48b64f3d4306d03687b35` |
| `connect-light.png` | `6cca4ec7796509b1680f97d0c9d2ebfd33b91e1c6855e7c456de54363d6f9c34` |
| `home-widgets-dark.png` | `fb512b6e958b8266d2ca217b162dcec7374c235ec739b214143fd2773d41dd67` |
| `home-widgets-light.png` | `1c9c119e33adb8e7ddfaf1c3c7fcd836ad45c9d703ce68539e83e047ae6655d8` |
| `quick-settings-tile-dark.png` | `a8b779ae1f20e60e043ee473603c2843dec7e0e51043f35277d04bcbf85c1e09` |
| `quick-settings-tile-light.png` | `7341a296d2eb188f3eec86a9aea914697c5cc71e5c412a8398c437a5c0685164` |
| `quick-settings-tile-narrow-dark.png` | `c4a343bdefd67292c0b09e1363fcbeb7c3a46af3e0d539476c85e4202a048c89` |
| `quick-settings-tile-narrow-light.png` | `d36c2e4958df45bf58793db25090dd902fddabc39120ba40810dafc9eb40e893` |
| `repository-issues-and-prs-dark.png` | `c6ff777480c7b711034f8d62ff68738cb05e8df095000ff6a23adf3a1e4ef08b` |
| `repository-issues-and-prs-light.png` | `15d5f4750ccdd7719fb9ab04ebcad4514b64a9b1ded479dbcfcd36e8748bf7d2` |
| `repository-prs-dark.png` | `084df7feb6e788feb6dcdb755fc473aa4721516122b761d41851e8043e3bed61` |
| `signin-code-dark.png` | `3954cb4c329822dd7855da54428d8fe42aa3e2b95b23373cf01a314483fa6681` |
| `signin-code-light.png` | `39dccaa44875f763f7d93c5c845d2aa141da50268261384a7a89b1be056ef07b` |

The cuts (Pillow, WebP quality 84, 540 and 1080 px wide): phone frames are
9:16 crops of the 1080x2364 capture from the top (`home-widgets` from
y = 120 so the smartspace, both widgets, the hotseat and the search bar
stay in frame); cut-outs are the element's own box from the launcher and
app dumps: `widgets-cutout` (30,436)-(796,1828), `pinned-widget`
(30,436)-(796,1552), `repository-widget` (30,1540)-(541,1828),
`catalog-rows` (0,840)-(1080,1920), `repository-rows` (0,600)-(1080,1680),
`tile-row` (0,560)-(1080,1400). `src/content/screenshots.ts` carries each
slug's alt text and the 540 px file's dimensions.

`public/icon-512.png` is the Play icon from the same release. The marks in
`public/mark.svg` and `public/favicon.svg` are hand conversions of the
app's launcher vectors.

## Open Graph image

`public/og-image.png`, the image every shared link shows, was decided in
GrillTrack `og-image-009` (2026-10-01): one five-candidate round judged in
link-preview card mimics fed by the real meta tags
(`.grilltrack/proof/og-round-1-captures-20261001.md`); `design.md` v4
records the composition. It is generated, not drawn:

- `scripts/og-image/og-image.html` is the 1200x630 card in the decided
  look: the ink band, the commit-eye rings at 5%, the mark inline, the
  eyebrow and the hero line of the home hero injected from
  `seed/seed.json` by the script (the copy lock stays the single source),
  the Pinned repos widget cut-out from the shipped
  `public/screenshots/pinned-widget-1080.webp` (header and three rows of
  made-up repositories), and `repoglance.com` in mono.
- `node scripts/og-image.mjs` renders it through Google Chrome's DevTools
  protocol (headless, 1200x630, device scale factor 1, after fonts and the
  image have loaded) and writes `public/og-image.png`;
  `node scripts/og-image.mjs --check` renders again and compares with the
  committed file. Not part of `npm run verify`; needs a local Chrome.
- The committed file was rendered on macOS with Google Chrome
  154.0.8037.59 and the system faces `.SF NS` (`.SFNS-Bold`, the heading
  and the wordmark) and `Menlo` (`Menlo-Regular`, the eyebrow and the
  domain). The committed `public/og-image.png` is 1200x630 and 118269
  bytes; its SHA-256 is
  `b607c73c7e31157dc157066e8db4d544958a005b950302e462ba8574912cced1`.
  Two renders on that machine were byte-identical; another machine's
  faces or Chrome build give a different file, so regenerate and update
  this hash together (`tests/content.test.mjs` compares them).
- `src/layouts/Site.astro` serves it on both pages as `og:image` with
  `og:image:type`, `og:image:width` 1200, `og:image:height` 630 and an
  `og:image:alt` that says the repositories are made up;
  `twitter:card` stays `summary_large_image`. `scripts/smoke.mjs` checks
  that the served file equals the committed one.

Before this decision the file was the Play feature graphic (sample-mode
art, 1024x500, SHA-256
`68a0ffa50e5d48fb3bf792664746d1594e4063b477bcc98b962ee5314258b1b8`).
