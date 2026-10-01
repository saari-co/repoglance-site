# Design contract: repoglance.com

- **Version:** 2 (2026-10-01): the copy in the locked layout
  [site-copy-006], decided in one five-candidate round and a confirmed
  hybrid. Version 1 (2026-10-01) locked the layout and visual language
  [site-look-005] after four rounds and a confirmed hybrid; version 0
  (2026-10-01) started the file with constraints only.
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
  - Truth first: only proven behaviour, every screenshot from sample mode.
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
- **Imagery:** seven sample-mode captures from the Play listing release
  `repoglance-play-listing-20260930-040`, 540 and 1080 px WebP under
  `public/screenshots/` (`docs/content.md`).
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
  (10 px radius, `min(78vw, 300px)` wide) with the phone capture cropped to
  280 px at the top and a mono 0.8 rem head; the row bleeds to the viewport
  edge on phones.
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
  stated on both pages, the Google Group link in the hero and step 1, the
  missing opt-in link stated, the version named, no Play URL, no CI claim
  beyond "not yet", no "stack"; `tests/content.test.mjs` enforces them.
  - **Rejected (round 1, do not reintroduce without a new grill):** the
    foundation's voice at full length (A, except its call to action),
    the benefit-first second person (B), the facts-first register on the
    home page (C, kept only for the join page's steps and build list),
    the formal privacy-led register (E).
- **Proof:** `.grilltrack/proof/look-round-1-captures-20261001.md` to
  `look-round-4-captures-20261001.md`,
  `look-hybrid-1-captures-20261001.md`, the production verification in
  `.grilltrack/proof/site-look-005-verify-20261001.md`; for the copy,
  `copy-round-1-captures-20261001.md`,
  `copy-hybrid-1-captures-20261001.md` and
  `site-copy-006-verify-20261001.md`.

## Unresolved (decided by GrillTrack, one slot per round)

- **Typography roles beyond system faces:** not grilled; system faces are
  the lock until a font round says otherwise.
- **Motion:** none today; the slider scrolls natively. Not grilled.
- **Open Graph image:** still the Play feature graphic. Not grilled.

## Verification expectations

- Judge every change on the real pages in Chromium at 375 and 1280 px, light
  and dark, with the seeded content; `npm run verify` must pass.
- Committed proof is text under `proof/` and `.grilltrack/proof/`; captures
  stay in ignored `runs/` or external asset storage.
