# site-scheme-imagery-010 verification (2026-10-06)

The locked colour scheme of the imagery (design.md v5, the confirmed
hybrid "E on the home page, D on the join page") implemented in the real
site on branch `claude/site-scheme-imagery` (from `origin/main` at
`21cc5e8143ff0acbb730f0fb4b9737a999e84778`) and verified on the
production build of the working tree that became the implementation
commit (the commit SHA is recorded in the ledger's review entry and
below once reviewed).

## Lock

Maintainer, 2026-10-06: "E for homepage D for join page" on the round-1
picker (`scheme-round-1-captures-20261006.md`), then "lock it" on the
hybrid previewed alone (`scheme-hybrid-1-captures-20261006.md`).
Dependencies: `site-imagery-007` (the subjects, crops and slot
assignments, untouched) and `site-look-005` (the bands that invert, which
the home hero's band policy answers). Both stay represented: the captures
below are byte-identical to the hybrid preview's, which was rendered on
the production canvas of `main`.

## Implementation

- `public/screenshots/`: 24 light cuts, `<slug>-light-540.webp` and
  `<slug>-light-1080.webp` for the twelve slugs with a light capture in
  the showcase-048 release (`repository-prs` has none), cut by
  `.grilltrack/work/scheme-round-1/build-assets.py` with the recipe in
  `docs/content.md` after checking the fifteen source hashes recorded
  there; the 26 dark files are unchanged (the same cutter reproduced
  them byte for byte). Output hashes:

  | File | SHA-256 |
  | --- | --- |
  | `catalog-pinned-light-540.webp` | `d6ca9e258cca671a8880e7018894f34b8b3ffac1eec25623c4bae5f043b954a5` |
  | `catalog-pinned-light-1080.webp` | `e5495bac0ca48b8ad03f2af6e5d72cbccce10ebe7a0d8366e069a6908c655d11` |
  | `catalog-rows-light-540.webp` | `c11b2a3b1a4b08dc14e58fd2aacec82609a868b9096263cb7bcfce45dce030d7` |
  | `catalog-rows-light-1080.webp` | `4b06155e176df79d152b71b19189d5cab6504bb684bdae60a91c0947c371364a` |
  | `connect-or-explore-sample-light-540.webp` | `45c0ec1abc1e3d2fd35236ce54d3af0a9573f9e8f374593ada50fe2e7299293c` |
  | `connect-or-explore-sample-light-1080.webp` | `add22fd1c879463624ecdfa46894f28a1467b5165a62ec336e48641e0fe16fe7` |
  | `home-widgets-light-540.webp` | `0092e73d1d0204ea233b52209a35f58fb00fac0cf21805b64691a047b54d8748` |
  | `home-widgets-light-1080.webp` | `9eb67b24e490b246f83de0243b2d77ad7d63af4b1c2117cc4ba30d87a69bd7bf` |
  | `pinned-widget-light-540.webp` | `5cf79da56cc81d5b8fd547d0e9a5fe3f9eeaa030c41af356fe3f0f56f8c83162` |
  | `pinned-widget-light-1080.webp` | `7d3c36545a3894f1bbc5e02d01af688f6d5245e629d2e8a93afb4ce0fd6ae4c4` |
  | `quick-settings-tile-light-540.webp` | `7b446330df7e1512912807523552e26e246079cd0ac2e2b8792b421098db0f21` |
  | `quick-settings-tile-light-1080.webp` | `27f9726ecc489d365fbdd11dd25628195c67f8a974d30464c2df7cb97e00726e` |
  | `repository-issues-and-prs-light-540.webp` | `7af19a594f7b7d1360b97bd25e7ceb04395e839a603a03a245cd9109ef247ebb` |
  | `repository-issues-and-prs-light-1080.webp` | `7fcee54c5f48b24d0c917645564cb2d14cfb457b3c011ad3ddca6e192d2dec3e` |
  | `repository-rows-light-540.webp` | `fc9030fd5bec97263f8f0a4b4f472a60eddf569cf18bb0a468dc5430381928e7` |
  | `repository-rows-light-1080.webp` | `b092f798cb95bf7b8db403219c518a6a11fe93a181fff6ee0345263b40f22283` |
  | `repository-widget-light-540.webp` | `7f01a0075fd382552222d156238d2fea8e3918f6ff51a3ad352dd66fb117c904` |
  | `repository-widget-light-1080.webp` | `d279178749d8e5dacc9e30d5369ec0857e886617617dabf44e3654b013f72f1a` |
  | `signin-code-light-540.webp` | `e565a512f396938d04f58f3b4aa5e8c9e7984a7d583171c9ff92d1bb7182d208` |
  | `signin-code-light-1080.webp` | `65c61d74018f31dea6b2a864e777363debac08bf2c16955463197fec78b21db7` |
  | `tile-row-light-540.webp` | `3127d93e10fc6932981318dbd4a3c2746a2829e26cdd694a002552882707968c` |
  | `tile-row-light-1080.webp` | `a0db3657249408c6e37bc32722b0241b60366d09471ffe37a57d078e504dfbb0` |
  | `widgets-cutout-light-540.webp` | `52a745802856a45f07a29521aef0adb27350d29e0eb2bedd3fa25621ff79766c` |
  | `widgets-cutout-light-1080.webp` | `52c6b7c43b55858ac73e0c0c8a67fa148a183354718125b7b523e2e11fdf1fd4` |

- `src/components/Screenshot.astro`: a `scheme` prop (`page`, the
  default, or `band`); a slug whose entry says `light: true` renders a
  `<picture>` with a `(prefers-color-scheme: dark)` source and the
  `<img>` for the light scheme (`page`: light image, dark source;
  `band`: dark image, light source), both with the 540 and 1080 px
  files, the same `sizes`, dimensions, alt, loading and priority as
  before; a slug without a light cut renders the dark `<img>` alone
  inside a sourceless `<picture>`. `data-scheme` names the policy.
- `src/components/Hero.astro`: passes `scheme="band"` when the page is
  `/` (the pathname normalised as `Site.astro` does), `page` otherwise.
  `Feature.astro` unchanged (the default).
- `src/content/screenshots.ts`: `light: true` on twelve slugs,
  `light: false` on `repository-prs`; the comment names the files.
- `site.css`: unchanged. The hybrid carries no treatment, and the
  `<picture>` wrapper needs no rule: the captures below equal the
  preview's, which were rendered with the same wrapper on the canvas.
- `tests/content.test.mjs`: the screenshot test now also requires each
  option's `light` flag, the light files at both widths exactly when the
  flag is true, and a light cut for every slug the pages use; a new test
  pins the dark-scheme source in `Screenshot.astro`, the `page` default,
  the home-only `band` in `Hero.astro` and no policy in `Feature.astro`
  (11 content tests, 10 before).
- `scripts/smoke.mjs`: on `/`, the hero picture follows the band (dark
  image, light source, both widths), the four card pictures follow the
  page, exactly five pictures with one source each; on `/testers`, one
  picture following the page; two light assets served as `image/webp`
  (124 smoke checks, 117 before).
- `design.md` v5 (the version line, the scheme rule under the imagery,
  the rejected candidates, the proof references; scheme-matched imagery
  leaves the unresolved list), `docs/content.md` (the source table's
  note, the file naming, the cutter, a "Colour scheme" section, the rule
  in the test list) and `README.md` (the Look line names v5).
- `seed/seed.json` unchanged: the slugs, the copy and the alt rules are
  as locked.

## Verification

`npm run verify` on Node 22.23.2 (mise) in this worktree, exit 0
(`runs/verify-scheme-imagery-010.log`, ignored): audit 139 files (81
scanned), `astro check` 0 errors, 11 content tests (EmDash
`validateSeed` included), 9 guard tests, 12 edge tests, the Cloudflare
build, 124 smoke checks on local workerd with a fresh D1.

**The production build in both schemes.** The verified build served by
local workerd (`wrangler dev --local`, seed fallback): both pages saved
(`runs/scheme-verify/canvas/`), the served figures read back as
implemented (the home hero `data-scheme="band"` with the light source
and the dark image; the four cards and the join hero `data-scheme="page"`
with the dark source and the light image), four served assets equal to
the committed files byte for byte. Full-page captures via
`scripts/capture.mjs` (`FULL_PAGE=1`, 375x812 and 1280x900,
`prefers-color-scheme` emulated) are in the private asset release
[`repoglance-site-scheme-imagery-010-verify-20261006`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-scheme-imagery-010-verify-20261006)
of `saari-co/swarm-pr-assets`.

| File | SHA-256 |
| --- | --- |
| `final-home-dark-1280.png` | `05e45ca937af21682b42c6066b4adee2007ec38d75756fdd4c12102dfdbfe4bd` |
| `final-home-dark-375.png` | `4ec53bcca7f60c9fbd1d581a646d90969a12fcd9c04c59eabdd57ee58467f645` |
| `final-home-light-1280.png` | `4312736f0a99eeefd4920d6f8dc4b0420b1ff32e1d136b8a44c6b664654eea06` |
| `final-home-light-375.png` | `f1804e4907b3bf41ab159cfad9e3796e7d23e686e49e78f85a8c603fc3866794` |
| `final-testers-dark-1280.png` | `5b701b0c12ff8f0020f7cfeea4585e0ef74465572ef1aec3ddf02d6c849c4e59` |
| `final-testers-dark-375.png` | `a9c347d74c791f8ebae66f3f31eae9bfdd643fa76fa4490bbf00fffa64bbac3c` |
| `final-testers-light-1280.png` | `771b392929348439fd31d92eee32a727009b3c56f6b4d114369d64463db3b083` |
| `final-testers-light-375.png` | `1d1d860157c13ba57e106aca5e097569a7110b6236c67ae6e441ca54db949846` |

**Against the locked hybrid.** All eight files are byte-identical to the
hybrid preview's `h-*` captures (`scheme-hybrid-1-captures-20261006.md`),
which are in turn round 1's `e-home-*` and `d-testers-*`: the production
site renders exactly what the maintainer confirmed, at both widths and in
both schemes. The join page on the dark scheme and the home hero on the
light scheme are also pixel-identical to the shipped state, as the lock
intends.

## Not proven here

Nothing is deployed; the live site still serves the dark cuts on both
schemes until the maintainer deploys. The light cut-outs on the light
scheme show the thin dark wallpaper margin recorded in design.md v5; it
is in the confirmed preview and the captures, not a defect of the build.
Chromium only, as in every round. Safari and Firefox honour
`<picture>` sources with `prefers-color-scheme` media the same way, but
no capture here proves it.

## Review round 1

Pending: the exact-source review of the implementation commit is
recorded below and in the ledger once adjudicated.
