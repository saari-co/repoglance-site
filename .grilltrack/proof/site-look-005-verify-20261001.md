# site-look-005 verification (2026-10-01)

The locked look (design.md v1) implemented in the real site on branch
`claude/site-foundation` and verified on the production build.

## Implementation

- `src/styles/site.css` (sha256 `2d1ae0730516b749e95663facb0673e14776bf521b8e0c33221de08a2d701dc5`): the full stylesheet for the
  look: page tokens for both schemes, the band tokens (ink flat, inverted on
  the dark scheme) with the commit-eye rings at 5% as the band motif, mono
  navigation and footer, 6 px buttons, the band hero, the snap-scrolling
  feature row, the centred fact list, the band call to action, the closing
  band, and the join page's narrower centred column.
- `src/components/ContentPage.astro`: consecutive `feature` blocks render
  inside `div.showcase` and consecutive `text_section` blocks inside
  `div.band.band-tail`, each group still through EmDash's native `Blocks`.
  The layout receives the page slug.
- `src/components/Hero.astro` and `Cta.astro`: wrapped in `div.band`.
- `src/layouts/Site.astro`: `<html data-page>`.
- `scripts/smoke.mjs`: asserts the band hero, four feature cards in the row
  and the band call to action on `/`, and the band hero, the closing band
  and the page attribute on `/testers`.
- `design.md` v1, README status line.

## Verification

`npm run verify` on this source, exit 0: audit 79 files (58 scanned), 0
type errors, 9 content and 9 guard tests, Cloudflare build, 66 smoke checks
on local workerd with a fresh D1 (the 64 from the foundation plus the two
structure checks).

Full-page captures of `npm run build` served by `npm run start` (local
workerd, seed fallback) through Chrome 154's DevTools protocol
(`scripts/capture.mjs`, `FULL_PAGE=1`, 375x812 and 1280x900,
`prefers-color-scheme` emulation). Files are in the private asset release
[`repoglance-site-look-005-verify-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-look-005-verify-20261001)
of `saari-co/swarm-pr-assets`.

| File | SHA-256 |
| --- | --- |
| `index-dark-1280.png` | `696023880d5b10c8a4bdd749f8db9068d072652ce49bf3d0efa8e69f62c382b7` |
| `index-dark-375.png` | `1b5dc6aa3a7340339711094ca1492cb5fee5fc4a390382b231672b8fc3dac26f` |
| `index-light-1280.png` | `2528dbfaf4b4ce66247ed823b228545f7f56cf01e3df87f80ee1d72692fdc53a` |
| `index-light-375.png` | `495263455bf613f2d7e716f58bc0d1996b8e888664f614b7f822578dc5be27d7` |
| `testers-dark-1280.png` | `6a6d397ac9f0c9ddfcd886c1c89683b9da493184db2d571cb3bbc04c9a7a3751` |
| `testers-dark-375.png` | `eb1a8b6638724d4a8c9a0b136deb13654ffc8ddf0044a2b9f9a356eba945b014` |
| `testers-light-1280.png` | `e5264ea63d1bb801d0d0b55ee4172f27d56446cdcf558133a362cb183d72aa4f` |
| `testers-light-375.png` | `748b1c725c50b5e5cbf18d5f1dee9906280b06e43e58fa64614cee9235de876d` |

Inspected directly against the confirmed hybrid preview
(`look-hybrid-1-captures-20261001.md`): the same bands, rings, slider,
fact list, call to action and join page composition on both pages, both
widths, both schemes; no horizontal overflow at 375 px; the mark follows
the scheme. Differences from the picker: none intended; the picker's
captured canvas and the built site share the stylesheet rules.

## Not proven here

As for the foundation: nothing is deployed; hosted behaviour, the Access
allow path and the CMS-backed render path are not exercised. The slider's
scroll behaviour was judged by layout only (static captures), not by
pointer or touch interaction.
