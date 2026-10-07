# Scheme round 1 captures (2026-10-06)

Decision `site-scheme-imagery-010` (scheme-matched page imagery), the
grill the ledger recommended after `og-image-009`. Branch
`claude/site-scheme-imagery` from `origin/main` at
`21cc5e8143ff0acbb730f0fb4b9737a999e84778` (PR #5 merged), worktree
`~/Developer/side-quests/repoglance-site/.claude/worktrees/dreamy-volhard-c2e929`.
Locked and kept on the canvas: the layout and visual language (design.md
v4, `site-look-005`), the copy (`site-copy-006`), the imagery
(`site-imagery-007`: the subjects, the crop boxes and the six slot
assignments: the home hero `home-widgets`, the four cards
`pinned-widget`, `catalog-rows`, `tile-row` and `signin-code`, the join
hero `signin-code`), the Open Graph image (`og-image-009`), the mark and
the system faces. The open slot is the scheme switch: which capture, dark
or light, each locked slot shows on each colour scheme, and any treatment
the switch needs. Today every slot shows the dark cut on both schemes;
that shipped state is the control, not a candidate.

Imagery round 1's candidate D (a `<picture>` that follows
`prefers-color-scheme`) was rejected there because the maintainer picked
the cut-out framing; with the framing locked, this round revisits the
switch on its own.

## Source imagery

The showcase-048 release
[`repoglance-showcase-048-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-showcase-048-20261001)
of `saari-co/swarm-pr-assets`, downloaded with `gh release download` and
hash-checked by `build-assets.py` against the fifteen SHA-256s in
`docs/content.md` (all fifteen equal; the script refuses to cut
otherwise). `build-assets.py` (Pillow 12.2.0) applies the recipe
`docs/content.md` records (WebP quality 84, method 6, 540 and 1080 px
wide, the phone frames as 9:16 crops from the top with `home-widgets`
from y = 120, the cut-outs by their boxes) to the dark and the light
files: 50 WebP files under ignored
`.grilltrack/work/scheme-round-1/screenshots/`, hashed in
`screenshots/manifest.json`. The 26 dark files are byte-identical to the
26 shipped files under `public/screenshots/` (checked file by file), so
the recipe reproduces the lock and the light cuts are its exact
counterparts; every light cut has the same dimensions as its dark one.

The light cuts the six locked slots would use:

| File | Bytes | SHA-256 |
| --- | --- | --- |
| `home-widgets-light-540.webp` | 21000 | `0092e73d1d0204ea233b52209a35f58fb00fac0cf21805b64691a047b54d8748` |
| `home-widgets-light-1080.webp` | 47322 | `9eb67b24e490b246f83de0243b2d77ad7d63af4b1c2117cc4ba30d87a69bd7bf` |
| `pinned-widget-light-540.webp` | 15254 | `5cf79da56cc81d5b8fd547d0e9a5fe3f9eeaa030c41af356fe3f0f56f8c83162` |
| `pinned-widget-light-1080.webp` | 32310 | `7d3c36545a3894f1bbc5e02d01af688f6d5245e629d2e8a93afb4ce0fd6ae4c4` |
| `catalog-rows-light-540.webp` | 10882 | `c11b2a3b1a4b08dc14e58fd2aacec82609a868b9096263cb7bcfce45dce030d7` |
| `catalog-rows-light-1080.webp` | 23622 | `4b06155e176df79d152b71b19189d5cab6504bb684bdae60a91c0947c371364a` |
| `tile-row-light-540.webp` | 11662 | `3127d93e10fc6932981318dbd4a3c2746a2829e26cdd694a002552882707968c` |
| `tile-row-light-1080.webp` | 24048 | `a0db3657249408c6e37bc32722b0241b60366d09471ffe37a57d078e504dfbb0` |
| `signin-code-light-540.webp` | 15014 | `e565a512f396938d04f58f3b4aa5e8c9e7984a7d583171c9ff92d1bb7182d208` |
| `signin-code-light-1080.webp` | 32410 | `65c61d74018f31dea6b2a864e777363debac08bf2c16955463197fec78b21db7` |

One fact of the captures that the candidates must carry honestly: the
launcher wallpaper is the same dark one in both themes, so the light
home screen is white widgets on a dark wallpaper, and the light
`pinned-widget` cut-out carries a thin dark wallpaper margin around the
white widget that the dark cut hides (the cut box keeps 20 px of
launcher around the widget's bounds).

## The picker

Development-only sidecar under ignored `.grilltrack/work/scheme-round-1/`
(never shipped), served with `python3 -m http.server 4365 --bind 127.0.0.1`
from that directory and opened at
`http://127.0.0.1:4365/?c=a&p=home&s=system`. Same controls as the
imagery round (buttons, keys 1-5 and arrows, P for the page, S for the
scheme, H to hide the chrome); neutral labels; `picker.json` validates
with GrillTrack's `validate_picker.py`.

The canvas is the production build of `main` at `21cc5e8` (`npm run
build` on Node 22.23.2 via mise) served by local workerd (`wrangler dev
--local`, seed fallback), saved as `canvas/home.html` and
`canvas/testers.html` with their stylesheets beside them. `engine.js`
keeps every block as captured and re-renders only each `figure.shot` the
way `Screenshot.astro` does (src, srcset, sizes, width, height, alt,
loading), choosing the capture per the candidate's per-slot policy:
`dark` or `light` always, `page` (the light cut on the light scheme, the
dark cut on the dark scheme, as a `<picture>` with a
`(prefers-color-scheme: dark)` source and the light image as the
default), or `band` (the inverse, for a phone that sits on the hero band,
which is ink on the light scheme and near-white on the dark one). When
the picker forces a scheme the engine renders the plain `<img>` of the
resolved capture, since a forced token set cannot drive a media query;
the captures use the system scheme with `prefers-color-scheme` emulated
instead. **Fidelity check** (`?selftest=1`): the control (every slot
`dark`) through the mirror equals the untouched canvas on both pages
once the sidecar's asset paths map back to the site's
(`home=identical testers=identical`).

| File | SHA-256 |
| --- | --- |
| `index.html` | `b13aec6506988b97e66aa9ef02905874592bb65bc097502423daf1e4d7507789` |
| `engine.js` | `a7357cf206634d196a25acd7f289ac0e7896a7d8b0089227cf7f0280ac8ef210` |
| `scheme.css` | `69e1b18354975af8fb7ea87bd61b0c90974a6e90ae3044542c64eefe9e51033c` |
| `picker.json` | `18b255a93a536662c61e963cab6b4b4a9b4971b39b84331d224d7449dba6fa7a` |
| `build-assets.py` | `ae6b167152aaa932ecee5d7bb13c90dfc0eea559a8165499d9d700e8aa58d7a4` |
| `build-scheme.mjs` | `bda4a9a13be950f7614e69c56b3f69bf0b8f89d48d0530cad436253d9fe2751a` |
| `candidates/labels.json` | `056f38963154ab5d52aa998acabb24051a908ce6d19de51bbaa2e5bb32d56844` |
| `candidates/a.config.json` | `97be1a711adf2bd30c79c7a2dfe2e2cd31cc9559ec31793fb00cc364f5b587a2` |
| `candidates/b.config.json` | `d6559d4108e5a754e62972b8dd3911eed4419f55c299d4e0ab6a63727d29c99b` |
| `candidates/b.css` | `68702bad6e6332187de0d7cc5b7ff5e12f72bf14136d9b19f8ff118707457730` |
| `candidates/c.config.json` | `15d0059ce960b23f7de3f5f11ad29f00359fcd175ee3dca9910d6c924525392a` |
| `candidates/d.config.json` | `ea8eea9e143cea19696d203da71e3dc1c09b275709107a82c0bd5f56762188be` |
| `candidates/e.config.json` | `52c39a3c7d8bca68a4081e6b2a81088622d419930b12bd5f1c926370f11506d5` |
| `canvas/home.html` | `ab79d20a7beed4319e4c2fb4e2a440d387efecc2e3ec6a90c96e5bc7c2f4b40a` |
| `canvas/testers.html` | `ea63410058f2df88c0e3f4e835e0bc0d9ea6baa4189949b3654da4a65ee6f4a2` |
| `canvas/shipped.json` | `cda3541a40508938e46d6d24f145130e887c5958dd69c9ecdb3c1b1534c8ffe1` |
| `screenshots/manifest.json` | `2e43be21b88cc9c497f01962f00c5bfaad21fc746208e299142ee9b7621360bd` |

## Candidates (per-slot scheme policy plus CSS on the shared canvas)

Every candidate keeps the seed, the slugs, the crops, the alt text and
the copy byte for byte (the seed deltas are empty by design: the slots
are locked); it changes only which capture each slot shows per scheme,
and B adds a treatment.

| Id | Label | Home hero | Cards (home screen, in the app, Quick Settings, when you sign in) | Join hero | Treatment |
| --- | --- | --- | --- | --- | --- |
| A | Follow the page | page | page, page, page, page | page | none; the cards keep the locked cut-out rule |
| B | Follow the page, cut-outs ringed | page | page, page, page, page | page | the three cut-outs become clipped, rung boxes: the figure takes the corners (16 px for the widget, 12 px otherwise), a hairline ring in `--line` and a soft shadow per scheme (10% ink on light, 45% black on dark); the Pinned repos widget is scaled 1.1 inside its box so the light cut's wallpaper margin stays outside the corners |
| C | Light throughout | light | light, light, light, light | light | none |
| D | Phones follow, cut-outs dark | page | dark, dark, dark, page | page | none |
| E | Follow the surface | band | page, page, page, page | band | none |

"page": the light cut on the light scheme, the dark cut on the dark
scheme. "band": the dark cut on the light scheme (the hero band is ink)
and the light cut on the dark scheme (the band is near-white).

## Captures

Full-page renders as in the imagery round (`scripts/capture.mjs`,
`FULL_PAGE=1`, 375x812 and 1280x900, `prefers-color-scheme` emulation,
`s=system`, picker chrome hidden with `capture=1`), renamed to
`<candidate>-<page>-<scheme>-<width>.png`. B was recaptured after its
treatment was corrected (the first cut widened the image instead of
clipping it); the hashes below are the recapture. Files are in the
private asset release
[`repoglance-site-scheme-round-1-20261006`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-scheme-round-1-20261006)
of `saari-co/swarm-pr-assets` (40 assets).

| File | SHA-256 |
| --- | --- |
| `a-home-dark-1280.png` | `da96c6c87428e0bc6b7d84a3a0aa831b41e9d8d2bb7287d96a9ca9b5290ee4b9` |
| `a-home-dark-375.png` | `eb3909b51e2ff7a61ed72dc202a6ad081fafbbe9f207456c697076320dd3524f` |
| `a-home-light-1280.png` | `aa48498280a828ae76a6d578fc6d634878f23db861bbc9da914a62d3495ce8cb` |
| `a-home-light-375.png` | `657610fba42f9fa37ec41a41459ed1ff035814fcf814b6ab285b17f2a9042aec` |
| `a-testers-dark-1280.png` | `5b701b0c12ff8f0020f7cfeea4585e0ef74465572ef1aec3ddf02d6c849c4e59` |
| `a-testers-dark-375.png` | `a9c347d74c791f8ebae66f3f31eae9bfdd643fa76fa4490bbf00fffa64bbac3c` |
| `a-testers-light-1280.png` | `771b392929348439fd31d92eee32a727009b3c56f6b4d114369d64463db3b083` |
| `a-testers-light-375.png` | `1d1d860157c13ba57e106aca5e097569a7110b6236c67ae6e441ca54db949846` |
| `b-home-dark-1280.png` | `19ba60638e39a20e9ec4973ebfe8e0b68cd0f837279a99ed215852c35ab4cc3c` |
| `b-home-dark-375.png` | `6d4b1faea496d71e9f0d0889ae90db1fc8927bed42122fdad32144843ae3f338` |
| `b-home-light-1280.png` | `7502ab3b948535aad26dd09bded2751c1c4c972c00dd1f85e151bf36ba2e8141` |
| `b-home-light-375.png` | `10aa32b26aa991c1cfe13d9b745ce08b2d03ef0e3f5f9038ccf4953faccfe415` |
| `b-testers-dark-1280.png` | `5b701b0c12ff8f0020f7cfeea4585e0ef74465572ef1aec3ddf02d6c849c4e59` |
| `b-testers-dark-375.png` | `a9c347d74c791f8ebae66f3f31eae9bfdd643fa76fa4490bbf00fffa64bbac3c` |
| `b-testers-light-1280.png` | `771b392929348439fd31d92eee32a727009b3c56f6b4d114369d64463db3b083` |
| `b-testers-light-375.png` | `1d1d860157c13ba57e106aca5e097569a7110b6236c67ae6e441ca54db949846` |
| `c-home-dark-1280.png` | `60a8d48fac23e6546ded0978e6afa366ac34fadbf803479623096eaf75e91d60` |
| `c-home-dark-375.png` | `c15824f9e747c53257bad9490245c6e224eb76569bd04526032168c250496364` |
| `c-home-light-1280.png` | `aa48498280a828ae76a6d578fc6d634878f23db861bbc9da914a62d3495ce8cb` |
| `c-home-light-375.png` | `657610fba42f9fa37ec41a41459ed1ff035814fcf814b6ab285b17f2a9042aec` |
| `c-testers-dark-1280.png` | `3b3584ee4bb7dde4ce7732da50295d730c6a11ba6ab383a403e103f49f1f1ec0` |
| `c-testers-dark-375.png` | `b1e6295cb7dcb8b36d9400953709a3964816c15aad12ac7aa0dffda001f50511` |
| `c-testers-light-1280.png` | `771b392929348439fd31d92eee32a727009b3c56f6b4d114369d64463db3b083` |
| `c-testers-light-375.png` | `1d1d860157c13ba57e106aca5e097569a7110b6236c67ae6e441ca54db949846` |
| `d-home-dark-1280.png` | `da96c6c87428e0bc6b7d84a3a0aa831b41e9d8d2bb7287d96a9ca9b5290ee4b9` |
| `d-home-dark-375.png` | `eb3909b51e2ff7a61ed72dc202a6ad081fafbbe9f207456c697076320dd3524f` |
| `d-home-light-1280.png` | `d2870c24d88e99c94a2a46b56c2966b8f229bb3ad6cfe226133fb65fcc18ec6c` |
| `d-home-light-375.png` | `99e205348a7f4ca9bddc68a9fa58c27de3c70efceea78e0a427e49a49a42bd14` |
| `d-testers-dark-1280.png` | `5b701b0c12ff8f0020f7cfeea4585e0ef74465572ef1aec3ddf02d6c849c4e59` |
| `d-testers-dark-375.png` | `a9c347d74c791f8ebae66f3f31eae9bfdd643fa76fa4490bbf00fffa64bbac3c` |
| `d-testers-light-1280.png` | `771b392929348439fd31d92eee32a727009b3c56f6b4d114369d64463db3b083` |
| `d-testers-light-375.png` | `1d1d860157c13ba57e106aca5e097569a7110b6236c67ae6e441ca54db949846` |
| `e-home-dark-1280.png` | `05e45ca937af21682b42c6066b4adee2007ec38d75756fdd4c12102dfdbfe4bd` |
| `e-home-dark-375.png` | `4ec53bcca7f60c9fbd1d581a646d90969a12fcd9c04c59eabdd57ee58467f645` |
| `e-home-light-1280.png` | `4312736f0a99eeefd4920d6f8dc4b0420b1ff32e1d136b8a44c6b664654eea06` |
| `e-home-light-375.png` | `f1804e4907b3bf41ab159cfad9e3796e7d23e686e49e78f85a8c603fc3866794` |
| `e-testers-dark-1280.png` | `3b3584ee4bb7dde4ce7732da50295d730c6a11ba6ab383a403e103f49f1f1ec0` |
| `e-testers-dark-375.png` | `b1e6295cb7dcb8b36d9400953709a3964816c15aad12ac7aa0dffda001f50511` |
| `e-testers-light-1280.png` | `bae9e07f2b10c9a0d1f77beb753e7e67a3005dffff02991e5ed65b36436c876c` |
| `e-testers-light-375.png` | `def548d5c2b42601f44149f7a72adc0c09e303ff6287d8aa5afa0eb5e308cc44` |

The equal hashes are consistency checks, not accidents: on the dark
scheme A, B and D render the join page as shipped (their
`testers-dark` files equal the imagery hybrid's `h-testers-dark-*`,
`imagery-hybrid-1-captures-20261001.md`), E's `testers-light` files
equal the hybrid's `h-testers-light-*` (the dark phone on the ink band,
as shipped), A and D share the dark home page (every slot dark), A and C
share the light home page (every slot light), and B's join page equals
A's (its treatment touches only the cut-outs).

## Inspection

Inspected directly: A to E on both pages at 375 and 1280 px in both
schemes (contact sheets of the forty captures, and the live picker at
1280 px). No overflow at 375 px; the locked composition, the hero phone
at 320 px and the join phone at 220 px hold in every candidate; the
sizes of the figures never change, so nothing reflows between schemes.
On the light scheme A shows the dark wallpaper margin of the light
widget cut-out as a thin dark frame inside the card's 16 px corners; B's
clipped box hides it (checked in the live pane: no margin on any side);
D hides it by keeping the cut-outs dark; C and E show it like A. On the
dark scheme the dark cut-outs sit on the near-black card with little
edge in A, C (light cut-outs, strong edge), D and E; B's ring and shadow
give them one. E's hero phone matches the band in both schemes (dark on
ink, light on near-white); A's contrasts with it in both.

## Fidelity limits

As in the imagery round: the production HTML with the slot deltas
applied by a component mirror, Chromium only, no CMS runtime. The images
are the site's own future assets, served from the sidecar; the
`<picture>` element is what `Screenshot.astro` would gain at lock, and
B's rules are what `site.css` would gain. The site build is not part of
this round.

## Outcome

Waiting for the maintainer's pick on the live picker. Nothing is locked
or written into `public/screenshots/`, `Screenshot.astro` or `site.css`
by this round.
