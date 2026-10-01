# Look round 1 captures (2026-10-01)

Decision `site-look-005` (layout and visual language), the first visual round
for repoglance.com. Branch `claude/site-foundation`; canvas captured from the
production build of the foundation (`6e1dda3` plus the native-blocks audit
commit) with the seed copy, the sample-mode imagery, the inline commit-eye
mark and system fonts locked.

## The picker

Development-only sidecar under ignored `.grilltrack/work/look-round-1/`
(never shipped): `index.html` (shell, sha256 `07392e559d0cc36269545eeed1cffba00a581821f6c99935d9c752a10ae2d36b`), `engine.js`
(variant engine, sha256 `142d45016f78a7c4df4b6c98c68615bd31c1d7ee6bac959e926582a8be5a4db2`), `candidates/[a-e].css`,
`picker.json` (validated with GrillTrack's `validate_picker.py`). Served with
`python3 -m http.server 4350 --bind 127.0.0.1` and opened at
`http://127.0.0.1:4350/?c=a&p=home&s=system`. Controls: pointer buttons,
keys 1-5 / arrows (candidate), P (page), S (scheme), H (hide chrome); the
bottom bar collapses on narrow viewports. Labels are neutral; nothing is
marked recommended.

## Candidates (deltas on the shared canvas)

| Id | Label | What changes |
| --- | --- | --- |
| A | One column | One 680 px reading column, monochrome ink only, hairline rules, numbered feature sections, inline phones under each section, square buttons, mono navigation and footer. |
| B | Tonal grid | Material-style tonal containers (28/24 px radius), pill navigation, the hero in a tonal card, features as a 2x2 card grid with phones peeking from the card bottom, a tonal fact band with accent dots, a blue call-to-action card. |
| C | Phone showcase | Centred type on a graphite-to-black hero band (the icon's gradient), the phone centred beneath the links, features as a snap-scrolling row of phone cards, fact tiles, a graphite call-to-action band. |
| D | Dense glance | Compact rhythm (15 px base), a mono status strip under the header, a small hero with the phone at 180 px, a hairline-celled feature grid with mono heads and small phones, facts as a three-column hairline list, mono section heads. |
| E | Full-width bands | Edge-to-edge bands: graphite hero band with the largest type and a shadowed phone, alternating feature bands with large phones, an inverted facts band, a bold blue call-to-action card. |

| Id | Delta file | SHA-256 |
| --- | --- | --- |
| A | `candidates/a.css` | `f10a64b095748e16af24fbe1917e5c27410632637f7899302284e997e9c1f0f2` |
| B | `candidates/b.css` | `af9fe37533be22df310404a3b26bad3072e8b993c88a395740e21ccc3063354e` |
| C | `candidates/c.css` | `5853c4a060eb4a98fdcbd1aef1e2c6eee92a63c7cf29d587503e11f117162031` |
| D | `candidates/d.css` | `f3a5060b08734fe917c64bfe05b2a80593e7171162ea8f97ba81a9d70f7170db` |
| E | `candidates/e.css` | `028bafa7faaaa51e047f2fd8334647f5c60410015c4af29eac9ae7f34e03aee9` |

Engine DOM operations: B and D wrap the feature sections in a grid
container; C wraps them in a scroll row; D inserts the status strip (text
drawn from the fact-list heading and the call to action); E wraps each
section in a full-bleed band. A is CSS only.

## Captures

Full-page renders through Chrome 154's DevTools protocol
(`scripts/capture.mjs` with `FULL_PAGE=1`, device metrics 375x812 and
1280x900, `prefers-color-scheme` emulation, picker chrome hidden with
`capture=1`). Files are in the private asset release
[`repoglance-site-look-round-1-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-look-round-1-20261001)
of `saari-co/swarm-pr-assets`; names are `<candidate>-<page>-<scheme>-<width>.png`.

| File | SHA-256 |
| --- | --- |
| `a-home-dark-1280.png` | `ba5e8c916d7bd1e7ed417c3f933268c975dd604c54ceafbf3cdacdd88fed8b04` |
| `a-home-dark-375.png` | `25d2bc7d0a760464db76589e874a9f41e3370afeb87a4399c09935821ed497b4` |
| `a-home-light-1280.png` | `5a12b62e2906585dd3d4f827e28a641aebae6361c739335651b163bd9a18694f` |
| `a-home-light-375.png` | `c85e33fc64c63a231599896c61732e2ec7a13e2a61aaa2e94928e7552418bc21` |
| `a-testers-dark-1280.png` | `e117c5be43aa32b7aa4fb2aaeceaf83d754cfa4b3998d7f3257ddf800db779fc` |
| `a-testers-dark-375.png` | `735d722b6e00a58fdad3628948d743562b11efb3226fceaed34783e1ec835a59` |
| `a-testers-light-1280.png` | `47c6a525a67dcc6f34777c795430899d62e4bf1c5d112c1220f4692e23ed538b` |
| `a-testers-light-375.png` | `e42ba14ba40772462bfd8179f38e674a72e38a58e94dc4170e1ec17a4daacbf6` |
| `b-home-dark-1280.png` | `fbb523b9f89907dc8a08981b8a4902141a4438af6793e4934ba4927f43fd23a7` |
| `b-home-dark-375.png` | `98ca5d225da17c3f93ac07153a0731bcdaa8f26618a14511f81c9e63a08a4e44` |
| `b-home-light-1280.png` | `68e2e1bbdc8ca45639a428eed2472782d0c458437dd1abd7b6690632426c2f54` |
| `b-home-light-375.png` | `33515c9fb44617e2ee3386eea4bb3df8a793b60073b5da304a4988359a805795` |
| `b-testers-dark-1280.png` | `7216b14dbac0d0201f58318a5bb34ac71539a04a5ae362e351f80c48654f5db9` |
| `b-testers-dark-375.png` | `45a0546bb70c02e595d2d88ea65da8846d271ab9b7a8e2f1d2a16871ae286da1` |
| `b-testers-light-1280.png` | `172ee49cc3add71b2fe6ef132efdce7b8233156ee588f79c0119a183c6462be2` |
| `b-testers-light-375.png` | `ef30ecc01e548c1001a41d2587b5afcfa788a3ff6e8f519f3220ebd073d897b7` |
| `c-home-dark-1280.png` | `21f021972efa50cd5f708e2eb46cd07e0c5201797b0878d5783298eb5d277cf9` |
| `c-home-dark-375.png` | `4c5727238c7e2c22714004a02499fb8984a70efb9bbbdd2d9aa84a7bef7ecaaf` |
| `c-home-light-1280.png` | `2950dc069957ea3e393103caf8868f37220350a97865b3014bd4757894c89239` |
| `c-home-light-375.png` | `f598cf124e8f5ea78f9913fa4916be90f2f44dabd854ab823c279a32892f48a9` |
| `c-testers-dark-1280.png` | `2702a31934a3aeb10b88810ca2bb7cbd463a29ee9bce121f42e4ccf4e0bd9e22` |
| `c-testers-dark-375.png` | `b396d86e69e8c24e9ccb00a62d4a8c98e9d23d9ac6132a49e3dd0ce7e2948e25` |
| `c-testers-light-1280.png` | `d6271e2afa849fab4669d58e9d92a81c8f96c046ed3eed310077438b68dfef3f` |
| `c-testers-light-375.png` | `1b10067d242cd56ca6a4a5b5b0797ff58656d8b258ceb87a5193b67a048ff8a7` |
| `d-home-dark-1280.png` | `5dd16db92e8f4e3d24c11c304b091b54971508134ff67f60ce979f059e7b8020` |
| `d-home-dark-375.png` | `f7571000e13c503dbc04ff1efea6d745d5bfe938824722cb6d8039b4605ffb39` |
| `d-home-light-1280.png` | `74b54f01136ae2a1476b22732fa5e56b6945872547e437364a3aa5cebdc69039` |
| `d-home-light-375.png` | `9c689f5fc8b68023609bcd0261b9ecf7a8e5bf8a31c40def4a55644420f8a39e` |
| `d-testers-dark-1280.png` | `607ea95725daf9bc1cb3cf780752fb1b5d65ee8b65f2fc93d4186e4473d67351` |
| `d-testers-dark-375.png` | `ebdcc934f9f692dc44e82a423de971d7755f95b0a7949ab48118bb29231e8382` |
| `d-testers-light-1280.png` | `40514c2a8fdfc5d80b93d04109f5b374c587cc59a8887a7d9618a61c5f6d8f44` |
| `d-testers-light-375.png` | `3115fb42424b745c0f154b66f84e3b0af4844fdc8f8e9dfb8e2337af9a2b6358` |
| `e-home-dark-1280.png` | `041351df486fe4d185459abb855f9872189dfb01c4be03211ddd2a93274a216a` |
| `e-home-dark-375.png` | `7eca879aa2f580a7fdef4ebbf9101d1cfa76f2028dee5e4dfc930c24216b700b` |
| `e-home-light-1280.png` | `b4728c290553d314adf2aae48864f580d9f62fed300ae27e2ea234bf2dd59467` |
| `e-home-light-375.png` | `19a4c5deadbf0579b656e4458d1e87e27ece74a12879dd188819e7820c877569` |
| `e-testers-dark-1280.png` | `28569c6c7221384a8bc635461f5a227fed74d434b3a20470f7584041b1800ce1` |
| `e-testers-dark-375.png` | `7f567982411f66d953135848b8afa21fd7a10e020b5d917a407519429958f77c` |
| `e-testers-light-1280.png` | `73bb97a04df76def515df009b0244eee806a4f1a7b2ed9b9a559f8edcc2f4721` |
| `e-testers-light-375.png` | `01eb41ceb0d8bfceb9ff4461e9ae6fcb4467a85094c49a0540fb9a65bc1b3d0e` |

Inspected directly: every candidate renders both pages at 375 px without
horizontal overflow in light and dark; the five differ in composition,
density and surface treatment, not colour alone. Candidate A's inline phones
were capped at 400 px after a first full-page render ran to 7,488 px.

## Fidelity limits

- The canvas is a capture of the production HTML with the built stylesheet
  inlined; links between the two pages are intercepted by the picker. No
  CMS, no EmDash runtime, no scripts of the site itself (it has none).
- Chromium only (Chrome 154 and the in-app browser pane). WebKit was not
  rendered.
- The maintainer's pick is implemented afterwards in `src/styles/site.css`
  and `design.md` v1 and verified on the real build; the picker is not
  that proof.
