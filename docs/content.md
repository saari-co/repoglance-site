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
present, no Play opt-in URL.

The wording was decided in GrillTrack `site-copy-006` (2026-10-01): one
five-candidate round on the real pages and a confirmed hybrid
(`.grilltrack/proof/copy-round-1-captures-20261001.md`,
`copy-hybrid-1-captures-20261001.md`); `design.md` v2 records the voice.
The hero heading on `/` is also asserted by `scripts/smoke.mjs`, so change
the seed and that check together.

## Screenshots

All seven captures are sample mode (**Explore with sample data**) from the
private asset release
`saari-co/swarm-pr-assets` `repoglance-play-listing-20260930-040`, taken on
the approved emulator from `main` at `d7421d3`. They were resized with `sips`
to 540 and 1080 px wide and encoded with `cwebp -q 84`. Source SHA-256s:

| Source file | SHA-256 |
| --- | --- |
| `phone-01-catalog-pinned.png` | `a2125e1d90bdb976c2cc16aef891bc30bc524d62302af1afad85e9bb4dc85f12` |
| `phone-02-repository-issues-and-prs.png` | `af4ca3a87071670272eb017ac9ebf6d88c900e1d6d9b8e75bef40abe31af83f5` |
| `phone-03-repository-prs.png` | `15a1c1b5e4af8212587326d66b4cad867c153a3b74b393d59c4ec2ae79fc1c1a` |
| `phone-04-owner-filter.png` | `96b1004710e2253b1bfb9d801d6df5da953513b12c42d6d984739391dd4fd974` |
| `phone-05-connect-or-explore-sample.png` | `e26d3dc08f4da4308d43c376b1b99b6d0ea8f6f3eaaee897ebf40d660b186127` |
| `phone-06-home-widgets.png` | `96d3239897c6f10d445d9451ebc86373ebef58058f8747191b6e1e132c415f45` |
| `phone-07-quick-settings-tile.png` | `ca2e02569ddd77b83216da357a1e17a63810b38009ba2cb828f6de741adf543c` |

`public/og-image.png` is the Play feature graphic and `public/icon-512.png`
the Play icon from the same release. The marks in `public/mark.svg` and
`public/favicon.svg` are hand conversions of the app's launcher vectors.
