# Scheme hybrid preview captures (2026-10-06)

Decision `site-scheme-imagery-010`. Scheme round 1
(`scheme-round-1-captures-20261006.md`) ended with a precise hybrid
request (maintainer, 2026-10-06): "E for homepage D for join page". Per
the frontend contract the hybrid is previewed alone as the replacement
for round 1's five, for confirmation. Nothing is locked by this preview.

## The hybrid

`candidates/h.config.json`, written by `build-hybrid.mjs` from round 1's
`e.config.json` and `d.config.json`: every home-page slot takes E's
policy and the join page's slot takes D's, so each page is exactly the
candidate named for it. No CSS (neither E nor D carries any).

| Page | Slot | Policy | Light scheme shows | Dark scheme shows |
| --- | --- | --- | --- | --- |
| `/` | hero (`home-widgets`) | band | the dark capture on the ink band | the light capture on the near-white band |
| `/` | On the home screen (`pinned-widget`) | page | light | dark |
| `/` | In the app (`catalog-rows`) | page | light | dark |
| `/` | In Quick Settings (`tile-row`) | page | light | dark |
| `/` | When you sign in (`signin-code`) | page | light | dark |
| `/testers` | hero (`signin-code`) | page | the light capture on the ink band | the dark capture on the near-white band |

Served from ignored `.grilltrack/work/scheme-hybrid-1/` (round 1's
engine, canvas, stylesheets and cut assets copied beside it, one
candidate, no five-candidate manifest) on
`http://127.0.0.1:4365/?c=h&p=home&s=system`; the round-1 picker on that
port was stopped (its files stay under `.grilltrack/work/scheme-round-1/`
and restart with the command in its `picker.json`). **Fidelity check**
(`?selftest=1`): the control through the mirror equals the untouched
canvas on both pages (`home=identical testers=identical`), as in round 1.

| File | SHA-256 |
| --- | --- |
| `index.html` | `aa1d9c26c21e3324f14fa50fca21db0ca50906217f6470bf178b1e8f3c2ff1a2` |
| `engine.js` | `66a53cc7d69aa97bc799ccbecaa76ce6ab94fa59461fec3790387dd74204844a` |
| `build-hybrid.mjs` | `57bbac753c85a2935d21193760d69f9e94ebbd916852accff11eb821e8fa0121` |
| `candidates/h.config.json` | `8dc6df9df969abe09b8704aaef47e5e07323a18ffd182c7a43ae8e46f1b11e27` |
| `candidates/labels.json` | `5f478331b0999eadb19f4526c7e9e55d46060d5c34199eb4ee3325d3e25a4305` |
| `canvas/home.html` | `ab79d20a7beed4319e4c2fb4e2a440d387efecc2e3ec6a90c96e5bc7c2f4b40a` |
| `canvas/testers.html` | `ea63410058f2df88c0e3f4e835e0bc0d9ea6baa4189949b3654da4a65ee6f4a2` |

`engine.js` differs from round 1's only in the bar's slot text ("hybrid
preview"); `scheme.css`, the stylesheets, the canvas and the 50 cut
assets are the round-1 files unchanged.

## Captures

Full-page renders as in round 1 (`scripts/capture.mjs`, `FULL_PAGE=1`,
375x812 and 1280x900, `prefers-color-scheme` emulation, picker chrome
hidden). Files are in the private asset release
[`repoglance-site-scheme-hybrid-1-20261006`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-scheme-hybrid-1-20261006)
of `saari-co/swarm-pr-assets` (8 assets).

| File | SHA-256 |
| --- | --- |
| `h-home-dark-1280.png` | `05e45ca937af21682b42c6066b4adee2007ec38d75756fdd4c12102dfdbfe4bd` |
| `h-home-dark-375.png` | `4ec53bcca7f60c9fbd1d581a646d90969a12fcd9c04c59eabdd57ee58467f645` |
| `h-home-light-1280.png` | `4312736f0a99eeefd4920d6f8dc4b0420b1ff32e1d136b8a44c6b664654eea06` |
| `h-home-light-375.png` | `f1804e4907b3bf41ab159cfad9e3796e7d23e686e49e78f85a8c603fc3866794` |
| `h-testers-dark-1280.png` | `5b701b0c12ff8f0020f7cfeea4585e0ef74465572ef1aec3ddf02d6c849c4e59` |
| `h-testers-dark-375.png` | `a9c347d74c791f8ebae66f3f31eae9bfdd643fa76fa4490bbf00fffa64bbac3c` |
| `h-testers-light-1280.png` | `771b392929348439fd31d92eee32a727009b3c56f6b4d114369d64463db3b083` |
| `h-testers-light-375.png` | `1d1d860157c13ba57e106aca5e097569a7110b6236c67ae6e441ca54db949846` |

The hybrid is exactly its parents, byte for byte: the four home files
equal round 1's `e-home-*` and the four join files equal round 1's
`d-testers-*` (which A, B and C share on the light scheme and A and B on
the dark). The join page on the dark scheme is also the shipped state
(the imagery hybrid's `h-testers-dark-*`, 2026-10-01).

## Inspection

Inspected directly on both pages, both widths, both schemes: the home
hero keeps the dark phone on the ink band on the light scheme (as
shipped) and shows the light phone on the near-white band on the dark
scheme; the four cards switch with the page, with the light widget
cut-out's dark wallpaper margin visible inside the card's corners on the
light scheme, as in round 1's A, C and E; the join hero shows the light
sign-in phone on the ink band on the light scheme and the dark one on
the near-white band on the dark scheme. No overflow at 375 px; the
locked composition holds. One thing to weigh: the two heroes now follow
opposite rules (the home phone matches its band, the join phone contrasts
with it), so a visitor who moves from one page to the other on the light
scheme sees a dark phone, then a light one.

## Outcome

Waiting for the maintainer's confirmation.
