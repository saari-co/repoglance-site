# Look hybrid preview captures (2026-10-01)

Decision `site-look-005`. Round 4 ended with a pick and a precise hybrid
request (maintainer, 2026-10-01): "I really like A! I think it would be
cool to do the same thing you did with the logo in [E] though with a
different shade of white (or maybe grey) so you can faintly see the logo in
the white banners." Per the frontend contract the hybrid is previewed alone
as the replacement for round 4's five, for confirmation.

## The hybrid

`candidates/base-r4.css` (sha256 `20e2cb1b23a77e58917b5a23115c6f2e5ee63bbd87024343b5e2ab2fc50411bd`, rounds 1 to 3 locked) plus
`candidates/h.css` (sha256 `d05dad434065cfbfc952afc32c6a4e64ec3fe6421948f33859c74b20bb5d27ef`): round-4 A's flat ink bands
(near-black #1b1d21 on the light scheme, near-white #e7e9ee on the dark
scheme, buttons inverted to match) carrying round-4 E's commit-eye rings as
a faint motif at the right edge of every band. The ring stroke is white at
8% opacity on the near-black band and the ink #111317 at 8% on the
near-white band, which reads as a light grey.

Served from ignored `.grilltrack/work/look-hybrid-1/` on
`http://127.0.0.1:4354/?c=h&p=home&s=system` (one candidate, no
five-candidate manifest).

## Captures

Full-page renders as in the rounds (`scripts/capture.mjs`, `FULL_PAGE=1`,
375x812 and 1280x900, `prefers-color-scheme` emulation, picker chrome
hidden). Files are in the private asset release
[`repoglance-site-look-hybrid-1-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-look-hybrid-1-20261001)
of `saari-co/swarm-pr-assets`.

| File | SHA-256 |
| --- | --- |
| `h-home-dark-1280.png` | `4ca05a395c778803ee6e1997d48f813186a54311ae7b3ff772bec9c66190658d` |
| `h-home-dark-375.png` | `8b39ad2ad59d1dbbe565a059a7fe8ff6393e1722d3d3a7f652d9e9186328f297` |
| `h-home-light-1280.png` | `53d7d6686a1fbda2e91e3c56a9d1e0e8fc5e16e161aa619bc38e1d4126ce1878` |
| `h-home-light-375.png` | `e40e6d304a12fe1c68d69787081a15037a8a9f3324467ac1987871f012df9ef4` |
| `h-testers-dark-1280.png` | `6238206014f21ea9ca5e5567b5f7fad6046a8cd2ae0b8ac54975b3780cf86cb8` |
| `h-testers-dark-375.png` | `af0bbbcbe59cec493936ef10c08045277726e3cdde5d6d40f356e85577d58dc2` |
| `h-testers-light-1280.png` | `58740fffc64abc19173833fe840fb721c4bb2f7546c52a46ea80ffbc2bfcaae1` |
| `h-testers-light-375.png` | `58befbf43b8858f07bf6cb040c517b3b79e52b1ce32a4b05b09d81ca916046df` |

Inspected directly: the rings read faintly on both band colours at both
widths; no defects.
