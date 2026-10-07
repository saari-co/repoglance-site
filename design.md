# Design contract: repoglance.com

- **Version:** 5 (2026-10-06): scheme-matched page imagery
  [site-scheme-imagery-010], decided in one five-candidate round on the
  real pages and a confirmed hybrid. Version 4 (2026-10-01) locked the
  Open Graph image [og-image-009], decided in one five-candidate round
  judged as link-preview cards; version 3 (2026-10-01) locked the imagery [site-imagery-007], decided in
  one five-candidate round and a confirmed hybrid, with one card's copy
  amended to match [site-copy-006]; version 2 (2026-10-01) locked the copy
  [site-copy-006]; version 1 (2026-10-01) locked the layout and visual
  language [site-look-005]; version 0 (2026-10-01) started the file with
  constraints only.
- **Canonical path:** `design.md` at the repository root.
- **Decision history:** `.grilltrack/ledger.json`. Where they disagree, the
  ledger owns history and this file owns the current, implementable design.
- **Scope:** the public pages of repoglance.com.

## Intent and constraints

- **Purpose:** introduce RepoGlance truthfully and get a Pixel owner into the
  closed test in one visit.
- **Audience:** developers with a Pixel phone or foldable, arriving from the
  Play listing, GitHub, or a link.
- **Family:** the app's own contract, `saari-co/RepoGlance` `docs/design.md`,
  is the reference: the commit-eye mark, monospace labels in sentence case,
  Material 3 colour roles with light and dark themes. The site reads as the
  same crew without pretending to be an Android screen.
- **Hard constraints:**
  - Truth first: only proven behaviour; every screenshot is a showcase
    capture of made-up repositories under fictional owners, never a live
    account, never a screen that says sample, and the sign-in code shown
    is a fixture.
  - No Google or GitHub brand assets; no Gemini sparkle, no four-colour sweep.
  - Both colour schemes, phone width first, no horizontal scroll, keyboard
    reachable, visible focus.
  - No third-party scripts or fonts; system faces.
  - The live picker is development tooling under `.grilltrack/work/` and never
    ships.

## Verified foundations

- **Mark:** the header inlines the commit-eye magnifier so `currentColor`
  follows the scheme; `public/mark.svg` and `public/favicon.svg` carry the
  same geometry, converted from the app's launcher vectors.
- **Imagery [site-imagery-007, "C with the sign-in code screen"]:** the
  app's showcase captures (RepoGlance `showcase-048`: sample mode rendered
  without its marker under the fictional owners `saltmarsh-io`,
  `ferrywood` and `elin-tidewater` on the approved emulator's cover
  display, dark theme, SystemUI demo clock at 9:30), cut into 540 and 1080
  px WebP under `public/screenshots/` (`docs/content.md` has the source
  release, hashes and crops). Thirteen slugs ship so the CMS can pick any:
  seven phone frames (9:16 crops) and six cut-outs; only the six slot
  assignments below were previewed, and an unused slug picked in the CMS
  renders with the generic card rule (cover from the top, 12 px corners).
  The pages use: the
  home hero shows the home screen phone with both widgets; the four cards
  show the element each card is about, cut from the capture and set on
  the card with its own corners (the Pinned repos widget, the catalog
  rows, the Quick Settings row with the tile, the sign-in code screen as
  a centred phone crop); the join hero shows the sign-in code screen phone
  at 220 px. `Screenshot.astro` carries `data-shot` and each slug's own
  dimensions (and, since v5, `data-scheme` and the `<picture>` that
  follows the colour scheme); `site.css` sets the card image to 280 px,
  `object-fit: cover` from the top with 12 px corners (16 px for widgets,
  left-aligned for the tile row, centred for phones).
  - **Rejected (round 1, do not reintroduce without a new grill):** the
    shipped framing of top-cropped phones (A), aimed phone crops (B),
    scheme-matched images via `<picture>` on the aimed crops (D; the
    switch itself was decided on its own in v5), the widgets cut-out as
    the hero with no phone (E), and the Connect screen for the sign-in
    slots (the hybrid replaced it with the device-code screen).
  - **Rejected earlier:** the Play listing's sample-mode captures (the
    foundation's imagery, reopened by the maintainer on 2026-10-01: marked
    SAMPLE throughout and cropped without regard to the cards).
- **Colour scheme of the imagery [site-scheme-imagery-010, "E on the
  home page, D on the join page"]:** every image is a `<picture>` with a
  `(prefers-color-scheme: dark)` source, cut from the same capture in
  both themes with the same box, so nothing reflows when the scheme
  changes. Images follow the page: the light cut on the light scheme,
  the dark cut on the dark scheme (the four home cards, the join hero,
  and any slug the CMS picks). The home hero's phone follows the band it
  sits on instead: the dark home screen on the ink band of the light
  scheme, the light one on the near-white band of the dark scheme
  (`Hero.astro` passes `scheme="band"` on the home page only). The light
  cuts ship beside the dark ones as `<slug>-light-{540,1080}.webp` for
  every slug with a light capture (`repository-prs` has none and renders
  its dark cut alone); `src/content/screenshots.ts` declares which. No
  treatment changed: the cut-outs keep the card rule above, so the light
  Pinned repos widget shows a thin dark wallpaper margin inside the
  card's corners on the light scheme (the launcher wallpaper is dark in
  both themes), a fact of the capture the maintainer saw and kept.
  - **Rejected (round 1, do not reintroduce without a new grill):** every
    slot following the page, including the home hero (A); the same with
    the cut-outs set in clipped, rung boxes and the widget scaled past
    its wallpaper margin (B); the light captures throughout (C); the
    cut-outs kept dark with only the phones following (D, kept for the
    join page only); the join hero following the band (E, kept for the
    home page only); and the shipped dark-throughout state, the control.
- **Content structure:** `seed/seed.json` blocks `hero`, `feature`,
  `fact_list`, `steps`, `cta`, `text_section`, rendered through EmDash's
  native `Blocks`. `ContentPage.astro` groups consecutive `feature` blocks
  into the slider and consecutive `text_section` blocks into the closing
  band; `<html data-page>` carries the page slug for page-specific rules.
- **Colour [site-look-005]:** the page is near-white on near-black ink
  (`--bg #f8f9fb`, `--fg #1b1d21`, `--muted #5b6069`, `--line #d9dde3`) and
  inverts on the dark scheme (`#111317`, `#e7e9ee`, `#a3a8b3`, `#2a2e36`).
  No accent colour: links are ink, underlined. The four status hues of the
  app are not used on the site (nothing here has a status).
- **Bands [site-look-005, "A ink flat + E mark"]:** three full-width bands
  carry the page: the hero on both pages, the home call to action, and the
  join page's closing feedback-and-privacy band. A band is flat ink,
  near-black `#1b1d21` with white type on the light scheme and near-white
  `#e7e9ee` with ink type on the dark scheme, with the buttons inverted to
  match. Each band carries the commit-eye rings as a motif at its right edge
  (520 px on the hero, 360 px elsewhere), stroked white at 5% on the dark
  band and ink `#111317` at 5% on the light band. Bands span the viewport
  from inside the 1040 px column (`margin-inline: calc(50% - 50vw)`), and
  `body` clips horizontal overflow.
  - **Rejected (rounds 1 to 4, do not reintroduce without a new grill):**
    graphite gradients (rounds 1 to 3), tonal surface bands, deep accent
    bands, hairline-only open bands (round 4), rings at 8% (hybrid preview).
- **Hero [rounds 1 to 3]:** text left, phone right (3:2 grid from 760 px,
  stacked below), mono eyebrow, display heading at
  `clamp(2.2rem, 6vw, 3.6rem)` with tight tracking, lead in the band's muted
  tone, two square buttons. The phone sits at 320 px with a deep shadow; on
  the join page the band is shorter, the heading smaller and the phone 220
  px.
  - **Rejected:** centred hero (round 1 C, round 2 C on the join page),
    phone beneath the links (round 3 A and D), no phone (round 2 A).
- **Buttons:** 6 px radius, 600 weight. Outside a band the primary is ink on
  page and the secondary is transparent with an ink border; inside a band
  they invert to the band's button tokens. No pills.
  - **Rejected:** pills (rounds 1 to 4 B and D), 999 px radius generally.
- **Navigation and footer:** mono at 0.82 rem and 0.78 rem, underlined
  links in ink; the header keeps a hairline below.
- **Home features [round 2 A]:** a snap-scrolling row of hairline cards
  (10 px radius, `min(78vw, 300px)` wide) with a 280 px image area at the
  top (since v3 a cut-out set on the card, see Imagery) and a mono 0.8 rem
  head; the row bleeds to the viewport edge on phones.
  - **Rejected:** stacked sections (round 1 A), 2x2 tonal cards (round 1 B),
    hairline-celled grid (round 1 D), alternating bands (round 1 E), tonal
    borderless cards (round 2 B).
- **Fact list [round 2 C]:** centred heading and intro over a 640 px
  left-aligned check list with hairlines between rows and a mono `✓`.
  - **Rejected:** tile grids (round 1 C), tonal band with dots (round 2 B),
    three-column dense list (round 2 D), inverted band (round 2 E).
- **Call to action [round 3 B]:** a band (above) with centred heading, muted
  copy and one inverted button.
  - **Rejected:** hairline card (round 3 A), inline strip (round 3 C), tonal
    container (round 3 D), card with the phone (round 3 E).
- **Join page [rounds 2 and 3]:** the same band hero, then an 800 px centred
  column: centred section heads, a 640 px left-aligned numbered list for the
  steps, the build list as a mono checklist, and feedback and privacy side
  by side in the closing band (stacked under 640 px).
  - **Rejected:** a narrow one-column page (round 2 A, "looks broken"),
    tile grids for the build list (round 1 C), three step columns (round 3
    C), tonal cards (round 3 D), a timeline with the phone beside the list
    (round 3 E).
- **Typography, body:** system sans for headings, reading text and buttons;
  system mono for the eyebrow, navigation, footer, feature heads and the
  join page's checklist. No bundled fonts.
- **Copy [site-copy-006, "D with A's call to action and C's join-page
  middle"]:** every sentence lives in `seed/seed.json` and traces to the
  sources in `docs/content.md`. The home page is written as moments: a
  hero that states the glance ("Glance at the home screen. Know where your
  repos stand."), four cards headed by where the moment happens (on the
  home screen, in the app, in Quick Settings, before you sign in), a fact
  list of the rules that hold ("What stays true all day", read-only first,
  "Not yet: a CI column" last) and a plain closing band ("Help test
  RepoGlance", "How to join"). The join page keeps the same voice in its
  hero ("Get the test build on your Pixel."), feedback and privacy, and
  turns terse for the two working blocks: "Three steps, in order" with the
  intro "Group first, Play second, install third." and a mono "In this
  build" list with the not-yet line. Rules every edit keeps: read-only
  stated on the home page (the eyebrow, the hero lead's "never changes
  anything on GitHub", the first fact) while the join page keeps to the
  test itself, the Google Group link in the hero and step 1, the missing
  opt-in link stated, the version named, no Play URL, no CI claim beyond
  "not yet", no "stack"; `tests/content.test.mjs` enforces them.
  - **Rejected (round 1, do not reintroduce without a new grill):** the
    foundation's voice at full length (A, except its call to action),
    the benefit-first second person (B), the facts-first register on the
    home page (C, kept only for the join page's steps and build list),
    the formal privacy-led register (E).
  - **Amended with the imagery lock:** the fourth home card reads "When
    you sign in" and describes GitHub's device flow, matching its sign-in
    code image; the sample-mode entry stays as its last sentence.
- **Open Graph image [og-image-009, "C Widget cut-out"]:**
  `public/og-image.png`, one 1200x630 image for both pages, is the ink
  band in the light scheme's tokens (`#1b1d21`, white type, muted
  `#c9ced6`, hairline `#4a4f57`) with the commit-eye rings at 5% behind
  the right edge (720 px, offset like the hero band's), the wordmark
  (the mark at 46 px and "RepoGlance" at 32 px, 600) top-left, the mono
  eyebrow at 22 px and the hero line at 58 px (700, tracking -0.03em,
  balanced) in a 600 px column at the left, the Pinned repos widget
  cut-out (the shipped `pinned-widget-1080.webp`, header and three rows,
  420x262 px, 26 px corners, a hairline and a soft shadow) floating at
  the right, and `repoglance.com` in mono at the bottom left. System
  faces as rendered on the generating machine. Generated by
  `scripts/og-image.mjs` from `scripts/og-image/og-image.html` with the
  eyebrow and the hero line read from `seed/seed.json`; `docs/content.md`
  records the renderer, the faces and the file's hash, which
  `tests/content.test.mjs` enforces. `Site.astro` declares the size and a
  made-up-data alt. A colour-scheme-matched image is not possible in Open
  Graph, so the light-scheme band is the one shared.
  - **Rejected (round 1, do not reintroduce without a new grill):** words
    only (A), the site hero with the phone (B), the mark large with the
    words at the right (D), a split panel with the home screen bleeding
    (E); and the Play feature graphic (sample-mode art, 1024x500) the
    foundation shipped.
- **Proof:** `.grilltrack/proof/look-round-1-captures-20261001.md` to
  `look-round-4-captures-20261001.md`,
  `look-hybrid-1-captures-20261001.md`, the production verification in
  `.grilltrack/proof/site-look-005-verify-20261001.md`; for the copy,
  `copy-round-1-captures-20261001.md`,
  `copy-hybrid-1-captures-20261001.md` and
  `site-copy-006-verify-20261001.md`; for the imagery,
  `imagery-round-1-captures-20261001.md`,
  `imagery-hybrid-1-captures-20261001.md` and
  `site-imagery-007-verify-20261001.md`; for the Open Graph image,
  `og-round-1-captures-20261001.md` and
  `site-og-image-009-verify-20261001.md`; for the colour scheme of the
  imagery, `scheme-round-1-captures-20261006.md`,
  `scheme-hybrid-1-captures-20261006.md` and
  `site-scheme-imagery-010-verify-20261006.md`.

## Unresolved (decided by GrillTrack, one slot per round)

- **Typography roles beyond system faces:** not grilled; system faces are
  the lock until a font round says otherwise.
- **Motion:** none today; the slider scrolls natively. Not grilled.

## Verification expectations

- Judge every change on the real pages in Chromium at 375 and 1280 px, light
  and dark, with the seeded content; `npm run verify` must pass.
- Committed proof is text under `proof/` and `.grilltrack/proof/`; captures
  stay in ignored `runs/` or external asset storage.
