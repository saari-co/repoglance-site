# Look hybrid preview captures (2026-10-01)

Decision `site-look-005`. Round 4 ended with a pick and a precise hybrid
request (maintainer, 2026-10-01): "I really like A! I think it would be
cool to do the same thing you did with the logo in [E] though with a
different shade of white (or maybe grey) so you can faintly see the logo in
the white banners." Per the frontend contract the hybrid is previewed alone
as the replacement for round 4's five, for confirmation.

## The hybrid

`candidates/base-r4.css` (sha256 `20e2cb1b23a77e58917b5a23115c6f2e5ee63bbd87024343b5e2ab2fc50411bd`, rounds 1 to 3 locked) plus
`candidates/h.css` (sha256 `f80f1d0236f734757e9ba7f6bdd0ab3814b1bf94cbaaff03ef9e87de284ea0bc`): round-4 A's flat ink bands
(near-black #1b1d21 on the light scheme, near-white #e7e9ee on the dark
scheme, buttons inverted to match) carrying round-4 E's commit-eye rings as
a faint motif at the right edge of every band. The ring stroke is white at
5% opacity on the near-black band and the ink #111317 at 5% on the
near-white band, which reads as a faint grey. (First preview used 8%; the
maintainer asked for fainter rings, 2026-10-01.)

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
| `h-home-dark-1280.png` | `e88942ad43cb8f65c6e1c2e0b20ab845ce5103ca723dc20b70e0c892e16fc819` |
| `h-home-dark-375.png` | `4cba062dbc1566f5dad4002abfbda150f8fe408e1356f9c69ef1e855d68fd0d7` |
| `h-home-light-1280.png` | `803cede99c49247ede711b8dea3016c3395e48e66e9bf01ac99e570c11d5c131` |
| `h-home-light-375.png` | `b38d907884a1375b2f714781472c2dffb7982ad186177f95ad133fbe4e782fdc` |
| `h-testers-dark-1280.png` | `28bcaa7ac26b4c1d1fb7640346dec32600b5e6d5e1bac5d6a5e9c356eadb161b` |
| `h-testers-dark-375.png` | `aca6b2cc393bd4e739643b8c87ae63bad0293875bbd2a7e888384838f06013dc` |
| `h-testers-light-1280.png` | `c92985cd8cce2867150421aa4448cd43fadb7002f4adf84a1dbf819421ee145b` |
| `h-testers-light-375.png` | `9cba0da3a04a439afb97c4ccf5f0c3b949a9748686ff1bb0229b121fcff10d84` |

Inspected directly: the rings read faintly on both band colours at both
widths; no defects.

## Outcome

Confirmed and locked by the maintainer on 2026-10-01 ("Yes, lock it" at
5%). Implemented in the real site: `site-look-005-verify-20261001.md`.
