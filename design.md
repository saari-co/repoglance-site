# Design contract: repoglance.com

- **Version:** 0 (2026-10-01). Constraints and intent only. No visual
  direction has been chosen; the styling in `src/styles/site.css` is a
  provisional scaffold and must not be read as the design.
- **Canonical path:** `design.md` at the repository root.
- **Decision history:** `.grilltrack/ledger.json`. Where they disagree, the
  ledger owns history and this file owns the current, implementable design.
- **Scope:** the public pages of repoglance.com.

## Intent and constraints

- **Purpose:** introduce RepoGlance truthfully and get a Pixel owner into the
  closed test in one visit.
- **Audience:** developers with a Pixel phone or foldable, arriving from the
  Play listing, GitHub, or a link.
- **Family:** the app's own contract,
  `saari-co/RepoGlance` `docs/design.md`, is the reference: the commit-eye
  mark, monospace labels in sentence case, tonal borderless controls, Material
  3 colour roles with light and dark themes, and the four status hues
  (emerald ok, amber working, red failing, neutral). The site should read as
  the same crew without pretending to be an Android screen.
- **Hard constraints:**
  - Truth first: only proven behaviour, every screenshot from sample mode.
  - No Google or GitHub brand assets; no Gemini sparkle, no four-colour sweep.
  - Both colour schemes, phone width first, no horizontal scroll, keyboard
    reachable, visible focus.
  - No third-party scripts or fonts; system faces until a font round decides
    otherwise.
  - The live picker is development tooling under `.grilltrack/work/` and never
    ships.

## Verified foundations

- **Mark:** `public/mark.svg` (currentColor) and `public/favicon.svg` are the
  app's commit-eye magnifier, converted from the launcher vectors in
  `saari-co/RepoGlance` (`ic_launcher_foreground.xml`,
  `ic_launcher_background.xml`).
- **Imagery:** seven sample-mode captures from the Play listing release
  `repoglance-play-listing-20260930-040`, resized to 540 and 1080 px wide
  WebP under `public/screenshots/` (`docs/content.md`).
- **Content structure:** `seed/seed.json` blocks `hero`, `feature`,
  `fact_list`, `steps`, `cta`, `text_section`.

## Unresolved (decided by GrillTrack, one slot per round)

- **Layout and visual language:** the first look round. Five candidates on
  the real pages.
- **Typography roles**, **colour tokens**, **motion**, **mobile navigation**:
  after the layout lock.

## Verification expectations

- Judge every candidate on the real pages in Chromium at phone and desktop
  widths, light and dark, with the seeded content.
- Committed proof is text under `proof/`; captures stay in ignored `runs/`
  or external asset storage.
