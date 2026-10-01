# site-look-005 verification (2026-10-01)

The locked look (design.md v1) implemented in the real site on branch
`claude/site-foundation` and verified on the production build.

## Implementation

- `src/styles/site.css` (sha256 `16905ceff3140136e872516f6eb1c03e4c978b06984193ec6389dff09d695df1`): the full stylesheet for the
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
| `index-dark-1280.png` | `35e7940fb8cfea416730b1b384a66d1d2f04a3a8555b721645f37ef8f5ec29b8` |
| `index-dark-375.png` | `87b72e52f267aee4fbb5fc6ed1a65f81a7ca8a887b785dc8de9c493913e36b4d` |
| `index-light-1280.png` | `2528dbfaf4b4ce66247ed823b228545f7f56cf01e3df87f80ee1d72692fdc53a` |
| `index-light-375.png` | `495263455bf613f2d7e716f58bc0d1996b8e888664f614b7f822578dc5be27d7` |
| `testers-dark-1280.png` | `58a975886f061c784922fe4478f99e4442da4c67e6d0fdb8cf72c027fbb3ba61` |
| `testers-dark-375.png` | `9e7feef07e98581ddb8e497501ecd38ca048e3f8f370b96aaf8fc38c5b7a87f8` |
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

## Review round 1

Exact-source review of the implementation commit
`b7c2ffe1584638f8db594043361a15a3ec6032e3` against design.md v1 and the
confirmed hybrid: one required fix. The dark-scheme `--band-mark` kept the
white stroke of the light scheme (a shell substitution that did not apply),
so the rings were invisible on the near-white band; the dark-scheme capture
confirmed it. Fixed in the follow-up commit (ink stroke `#111317` at 5% on
the dark scheme); `npm run verify` re-run (exit 0, 66 smoke checks) and the
captures re-taken and replaced in the asset release (hashes above). No
other findings: the grouping keeps every block inside EmDash's `Blocks`,
the page attribute is omitted on the 404 page, the band tokens meet
contrast on both schemes, and the smoke structure checks hold.
