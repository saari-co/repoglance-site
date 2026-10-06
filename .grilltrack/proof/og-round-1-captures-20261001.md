# OG round 1 captures (2026-10-01)

Decision `og-image-009` (the Open Graph and link-preview image), the
grill the ledger recommended after `site-imagery-007`. Branch
`claude/site-og-image` from `origin/main` at
`b32f2ea341db0335bfe76ef95f77990823075671`, worktree
`~/Developer/side-quests/repoglance-site/.claude/worktrees/nervous-mcclintock-5841eb`.
Locked and kept on the canvas: the layout and visual language (design.md
v3, `site-look-005`: ink band `#1b1d21`, the commit-eye rings stroked
white at 5%, system faces), the copy (`site-copy-006`: the hero line
"Glance at the home screen. Know where your repos stand." and the eyebrow
"Read-only GitHub widgets for Pixel", verbatim), the imagery
(`site-imagery-007`: showcase-048 captures, the same crop boxes as the
site's cuts) and the mark. The open slot is the image itself: what a
shared link shows.

Today `public/og-image.png` is the Play feature graphic (sample-mode art,
1024x500, sha256
`68a0ffa50e5d48fb3bf792664746d1594e4063b477bcc98b962ee5314258b1b8`),
not the 1.91:1 shape link previews expect.

## Source imagery

The showcase-048 release
[`repoglance-showcase-048-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-showcase-048-20261001)
of `saari-co/swarm-pr-assets`, downloaded and hash-checked against the
fifteen SHA-256s in `docs/content.md` (all equal). `build-assets.py`
(Pillow 12.2.0) cuts the pieces as lossless PNG at source resolution with
the crop boxes `site-imagery-007` already uses: `home-phone` (0,120)-(1080,2040),
`pinned-widget` (30,436)-(796,1552), `widgets-cutout`, `repository-widget`,
`tile-row`, plus the whole `home-widgets` capture for a bleed panel;
`assets/manifest.json` records each file's box, source hash and output
hash. The candidates use the dark set, like the site. `assets/rings.svg`
is `site.css`'s `--band-mark` as a file; `assets/mark-white.svg` is
`public/mark.svg` with `currentColor` set to white.

## The candidates

Each is a 1200x630 HTML page (`candidates/<id>.html` on
`candidates/shared.css`, the band tokens) rendered to `out/<id>.png` by
`render.mjs` through headless Google Chrome 154.0.8037.59 (DevTools
protocol, device scale factor 1, after `document.fonts.ready` and every
image loaded). Chrome resolved `system-ui` to `.SF NS` (`.SFNS-Bold` for
the heading) and `ui-monospace` to `Menlo` (`Menlo-Regular`) on this Mac
(no SF Mono installed system-wide). Rendering twice gave byte-identical
files.

| Id | Label | Composition |
| --- | --- | --- |
| A | Words only | Wordmark top-left, mono eyebrow, the hero line as two sentence lines at 74 px, `repoglance.com` bottom-left in mono, the rings at the right edge (760 px). No imagery. |
| B | Hero with phone | The site hero: wordmark, eyebrow, hero line at 60 px in a 640 px column; the home-screen phone (`home-phone`, 352 px wide, 28 px corners, the deep shadow) at the right, cut by the bottom edge above the hotseat; the rings behind it. |
| C | Widget cut-out | Wordmark, eyebrow, hero line at 58 px; the Pinned repos widget cut-out (header and three rows, 420x262 px, 26 px corners, a hairline `#4a4f57`, a soft shadow) floating at the right like a card; `repoglance.com` bottom-left; the rings behind. |
| D | Mark first | The commit-eye mark at full stroke, 360 px, left of centre with the rings concentric behind it (900 px); at the right "RepoGlance" at 40 px, the eyebrow and the hero line at 46 px. No cut-out, no domain. |
| E | Split panel | Ink at the left (56%) with wordmark, eyebrow, hero line at 54 px and the domain; the home screen's widget area bleeding to the right edge as a 528 px panel (`home-full` from under the smartspace: the Pinned widget whole, the Repository widget's first rows), a hairline between. |

| File | Bytes | SHA-256 |
| --- | --- | --- |
| `out/a.png` (released as `candidate-a.png`) | 72518 | `e897d01851de1562a746006a91c39de230efe15b77057598e08e27dfb9c4c771` |
| `out/b.png` (released as `candidate-b.png`) | 169814 | `5e294345f1616c09da866f98ddcc08a0cbbfaf65ffdcd228ab72be91850be4c7` |
| `out/c.png` (released as `candidate-c.png`) | 108473 | `0c6e41d2f1f046621262c5a985c61a2050cc83dbf9718e7fdb5e684d343db0ef` |
| `out/d.png` (released as `candidate-d.png`) | 79379 | `3155326ccc81e1b5fffd44dd7ac86c647e742af3e637563d78c9619789c07696` |
| `out/e.png` (released as `candidate-e.png`) | 196564 | `c306bc4952ed5b938f4fdf1a54d1fc7774eab3ff70de2966024132e903f3b3ad` |

## The picker

Development-only sidecar under ignored `.grilltrack/work/og-round-1/`
(never shipped), served with `python3 -m http.server 4360 --bind 127.0.0.1`
from that directory and opened at `http://127.0.0.1:4360/?c=a&p=home`.
Controls: buttons, keys 1-5 and arrows (candidate), P (page), H (hide
chrome); the bar collapses on narrow viewports; labels are neutral;
`picker.json` validates with GrillTrack's `validate_picker.py`.

**Through the real meta tags.** The canvas is the production build of
`main` at `b32f2ea` (`npm run build` on Node 22.23.1 via mise) served by
local workerd (`wrangler dev --local`, seed fallback), saved as
`canvas/home.html` and `canvas/testers.html`. The engine reads their
`og:site_name`, `og:title`, `og:description`, `og:url`, `og:image` and
`twitter:card` and lays the candidate image into local mimics of the card
shapes: a Slack-style unfurl (text first, 360 px image at full aspect),
a Discord-style embed (dark, 400 px image), an X-style
`summary_large_image` card (516 px, the image cropped to 2:1 with 16 px
corners and the domain pill, no description), a messaging-style rich link
(iMessage/WhatsApp: 280 px bubble, image on top, title and domain under
it), square centre crops at 160, 96 and 56 px with the image at 200 px,
and the image at 1200x630 with its hash. The page toggle switches between
the home tags and the join page's ("Join the closed test · RepoGlance").

**Fidelity limit.** The cards are local approximations built from each
service's documented card shape and size; they are not the real
renderers, which fetch the live page over the network and apply their own
scaling, cropping and caching. The live page today renders from the CMS,
whose entry still carries the pre-copy-lock description ("Read-only GitHub
widgets, pinned repos, and open issues and PRs at a glance, on your Pixel
home screen."); the canvas here is the seed fallback of the build. Chromium
only. Judging in a real renderer needs the image deployed, which is a hard
gate.

| File | SHA-256 |
| --- | --- |
| `index.html` | `04a1b4bdf0a1938b46b192190e1eb08aab0094deb3e90ee395081732ac6a6963` |
| `picker.css` | `cf85720035adbb65640676fbbab0a1b24f63397f73578cf52e4685b5df90a3e5` |
| `engine.js` | `d63319d088a05ad190a52f58ae5360c869b09a274ff1075c87623aecc695df28` |
| `picker.json` | `d9d01b6abb6c06bc038bb719345f26624957ef253405a7498bf56136408521ad` |
| `render.mjs` | `125d9b555786b496367e7717e46c7a4b4b8201db7e5e1a397ded214ec7926bce` |
| `build-assets.py` | `03fe7cbb9be5d50872027aca06b1b9b001e6332baf41a894b581691db0108f97` |
| `candidates/shared.css` | `e061c3213bcac6b4fa35a96b0701664dfa7e60b2fee872845857145de5bcc981` |
| `candidates/labels.json` | `f9eacd48a2edb3ae554cbc22b979b027e5608d3bec37a2e2f33b03de1c4d51c9` |
| `candidates/a.html` | `6cbb2f8825bbadd7b5201d98ec40a176e0d9a3322510595d4e1ead01e0480c55` |
| `candidates/b.html` | `fd74f5fc0ac1d624c6e9a7251ff2741c6bdd02cb63593b6f91e7c4de1ad959ec` |
| `candidates/c.html` | `9d4694debc55c3489be38b8e825cbd104f94ea31a63ba809caa1b80639569fe7` |
| `candidates/d.html` | `b00199497d4ab42124a09825400cd6c2519ca452fd0299634c55b3c241778107` |
| `candidates/e.html` | `47cd616608fb83d6d766d3ccf609e003b7b62945b1f599c4a833301c15782303` |
| `assets/manifest.json` | `2683625c202447aa519a1cdf0846eedfe65994e02928f987a5c021d355978286` |
| `assets/rings.svg` | `7fd2403d6a700bc7c20106ee6c89dbf6540da2b2ea8327551a946b8ccb64b1b9` |
| `assets/mark-white.svg` | `34fde4662c9ad138fb94b86269a32e161597f8ed585a6fc5b5d5c07fcc858d03` |
| `assets/favicon.svg` | `621f565e5cf91924abbc4fcace15fed788af2c1a404e4a1aba88b0d7391d054c` |
| `canvas/home.html` | `ee61c9c4cb7ae74ae588087af6c42b2756b03c474c09b6f6cb0c16fe4736a1d8` |
| `canvas/testers.html` | `4cbd9ee125eeeb3c5fc5e9334b27693e2fa53cd68bf507b320f7c1dcffff9ff2` |

## Captures

Full-page renders of the picker with its chrome hidden (`capture=1`) via
`scripts/capture.mjs` with `FULL_PAGE=1` at 375x812 and 1280x900; the
picker forces the light scheme, so the dark-scheme files were
byte-identical and dropped. Files, with the five candidate renders, are in
the private asset release
[`repoglance-site-og-round-1-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-og-round-1-20261001)
of `saari-co/swarm-pr-assets` (25 assets); names are
`<candidate>-<page>-light-<width>.png` and `candidate-<id>.png`.

| File | SHA-256 |
| --- | --- |
| `candidate-a.png` | `e897d01851de1562a746006a91c39de230efe15b77057598e08e27dfb9c4c771` |
| `candidate-b.png` | `5e294345f1616c09da866f98ddcc08a0cbbfaf65ffdcd228ab72be91850be4c7` |
| `candidate-c.png` | `0c6e41d2f1f046621262c5a985c61a2050cc83dbf9718e7fdb5e684d343db0ef` |
| `candidate-d.png` | `3155326ccc81e1b5fffd44dd7ac86c647e742af3e637563d78c9619789c07696` |
| `candidate-e.png` | `c306bc4952ed5b938f4fdf1a54d1fc7774eab3ff70de2966024132e903f3b3ad` |
| `a-home-light-1280.png` | `6b54a1dd7e0230e6416b5a7d4519c588e8859dd130bac050a15aa4b7bd8ccde9` |
| `a-home-light-375.png` | `afa57459cecb93434136900336c4f3469e1caba9959889f9c0d88f269aceff2b` |
| `a-testers-light-1280.png` | `b54ac6cf45a95e08a0b070a2b97b592dafa9311a93d60f2f64573011e90767c9` |
| `a-testers-light-375.png` | `644906ad1e5f4f27058c7551288b0f9ec7496ac94905c1bc6b236294f02be2f1` |
| `b-home-light-1280.png` | `d6a1e8b12ddc2a588855bd5255f54c1affac9af14a5e6ef488dc76331548a829` |
| `b-home-light-375.png` | `8019b51ca85b41105cede8f39c1a25197ce7f94e4d70b74c2807ea95c8c0ecdc` |
| `b-testers-light-1280.png` | `c9c255fbfc93fe3be0eb2c8a04d6686c64d03c36a6ad44da77695b9412d4c6d5` |
| `b-testers-light-375.png` | `0085443bbab26d15ce3f5798fd0fe9e21ea4e915910ab31fbdcf4e0775b5487a` |
| `c-home-light-1280.png` | `e67bf9d32916cd9fc1bca7a13a4c255cf15f868673ea21f2b1b9dca858aeff37` |
| `c-home-light-375.png` | `49ce0e32e9627919740fa5873dd474e111276131734b946e26a17c404f8bb5e0` |
| `c-testers-light-1280.png` | `dc040d4ed4b880211271969c2b9c2b7f40bff2126583d9f241ce89ab6738ca00` |
| `c-testers-light-375.png` | `00573024a9d7c4a38cfe245e3e73a53d8364b427d26f0bb24aeb1a3a43baf16d` |
| `d-home-light-1280.png` | `5c8dc2c02dfccca09feb9839b0eb21372de9942fb197dc68e9d256a5554d439d` |
| `d-home-light-375.png` | `472f7a99323c33aa9be896b2faeba695d416cce53e8ed5e1aca7069b412605b7` |
| `d-testers-light-1280.png` | `d7be733f9147a6c8ceb644c9e909e5c371bdcffd39a7c7502c5b6b09344bac0b` |
| `d-testers-light-375.png` | `684e993a0585c98117b25683a2fa1452f8a945024740bcaed9b090034e45a634` |
| `e-home-light-1280.png` | `91a8b486566ceca27bdc7fd84f2cb6ea9067e1ea53d110db60e836c329301acc` |
| `e-home-light-375.png` | `541f8c48135575072ec997cd9095835d19d5e04d4028963be6a48b1801243407` |
| `e-testers-light-1280.png` | `8285abcfa7ff69f796b18cc1e350cd64410bf05a107103ca1d36986afd208bbb` |
| `e-testers-light-375.png` | `e476f96a9e2731ff34ca239714b361f05cc4cf6d481d7637e08d94a64ef40ac1` |

## Inspection

Inspected directly: the five renders at 1200x630, and A to E in the picker
on both pages at 375 and 1280 px (the live pane and the captures). No
overflow at 375 px; the picker grid collapses to one column; keys 1-5 and
the buttons switch candidates and the title follows. In the X-style 2:1
crop every candidate keeps its words and its mark (15 px are lost top and
bottom). In the 160 px square crop A, B, C and E lose the start of each
line and the wordmark (the crop keeps x 285-915 of the image); D keeps the
mark's bowl and the words' start. In the messaging bubble and the Discord
embed every candidate's hero line is readable; the widget rows of C are
readable at 400 px and no longer at 280 px; B's phone text is not readable
below the full size. The hotseat's launcher icons stay out of every frame.

## Outcome

Maintainer, 2026-10-01: "C looks to be my favorite so far." Not a lock;
waiting for an explicit confirmation or a precise hybrid request. Nothing
is written into `public/og-image.png` by this round.
