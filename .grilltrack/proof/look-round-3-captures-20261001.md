# Look round 3 captures (2026-10-01)

Decision `site-look-005`, third round. Round 2 ended with feedback
(maintainer, 2026-10-01): "For Home: I like the hero on A, the slider on A;
the 'Read-only. no server. no tracking' I prefer the C/centered; I'm not in
love with any of the 'Help test RepoGlance' sections; let's run one more
round. For Join: A is terrible, it looks broken; C is my favorite but lacks
the imagery that B has which I like; otherwise not overly impressed with
any; run a round 3."

## Shared base (locked by rounds 1 and 2)

`candidates/base-r3.css` plus the hero-band and slider engine operations on
every candidate: the full-width graphite hero band on both pages; on home,
A's hero treatment (mono navigation and footer, square white band buttons),
A's hairline slider cards with mono heads, C's centred fact list with
hairline check rows; on the join page, C's centred layout with the phone
back in the band (beneath the links by default). Round 2's A column is
gone.

## The picker

Development-only sidecar under ignored `.grilltrack/work/look-round-3/`:
`index.html` (sha256 `d4e13dd21cb2d4a7785660be70c38ed202cf6e748aae73a86924e06adc2f9727`), `engine.js` (sha256 `46da04dbf2f52d947b04f91008bcd11a886d323437b244213216730d07945b4f`,
gains page-scoped operations and an injected-figure operation),
`candidates/`, `picker.json` (validated). Served with
`python3 -m http.server 4352 --bind 127.0.0.1`, opened at
`http://127.0.0.1:4352/?c=a&p=home&s=system`.

## Candidates (the open slot: the home call to action and the join page composition)

| Id | Label | Home call to action | Join page |
| --- | --- | --- | --- |
| A | Mono card | Hairline card, dash-prefixed heading, ink button, centred. | Phone beneath the links; mono-numbered hairline steps; build checklist; feedback and privacy as two hairline cards side by side. |
| B | Graphite band | Full-width graphite band mirroring the hero, centred, white button. | Phone right of the text in the band; centred steps and checklist; feedback and privacy close the page in a second graphite band. |
| C | Inline strip | Slim full-width strip with hairlines, text left and button right. | Phone right of the text; the three steps as three numbered columns; left-aligned checklist; feedback and privacy inline in two columns. |
| D | Tonal | Tonal rounded container with a pill button, centred. | Phone beneath the links; steps as tonal numbered cards in a row; the build list in a tonal container; feedback and privacy as tonal cards side by side. |
| E | Phone-led | Hairline card with the first-screen phone beside the text. | Phone right of the text; steps as a vertical timeline; the build list beside the home-screen phone; feedback and privacy stacked. |

| Part | File | SHA-256 |
| --- | --- | --- |
| base | `candidates/base-r3.css` | `9d06dcb2f183309e461312abf2ddc7ffb20803026c6301e69b56c5521a29a45d` |
| A | `candidates/a.css` | `ec1cb21a35090b18cfdba78493b672d2bc28878097055095dc65d4935e1d82f9` |
| B | `candidates/b.css` | `2718d2879b6ee13c944936f0dd51d76277e056cef59d123d79772ea02f8ec71a` |
| C | `candidates/c.css` | `344d0b1c5a65b8fc7ae06cbfffc5e0e96411694b3e1c9a672c4f26ba93696d00` |
| D | `candidates/d.css` | `4245a418f923787e6072e677b055ed77a396d251e8fcd419dea082fc75a34c5f` |
| E | `candidates/e.css` | `ce187ca55438fc572fed2e141d39b5067a8549786c9e0cd09c6bd39859e6f59f` |

E's figures are picker injections (the connect screen on the home call to
action, the home-screen capture beside the build list); choosing E means
adding an optional screenshot field to the `cta` and `fact_list` blocks in
`seed/seed.json`.

## Captures

Full-page renders as before (`scripts/capture.mjs`, `FULL_PAGE=1`, 375x812
and 1280x900, `prefers-color-scheme` emulation, picker chrome hidden). Files
are in the private asset release
[`repoglance-site-look-round-3-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-look-round-3-20261001)
of `saari-co/swarm-pr-assets`.

| File | SHA-256 |
| --- | --- |
| `a-home-dark-1280.png` | `e7fdc5fb0c949c560d610ac5ad3a7d31b0e1e70c7f571143ec71d8df113903a6` |
| `a-home-dark-375.png` | `58db1721c1c08361b5caa3951011fe4868953e16104e2a31f94bb1a3e1c84a6a` |
| `a-home-light-1280.png` | `cecf647d69e48299c08c368ea1cacdf021d65308eddf23904116af0af157b3fd` |
| `a-home-light-375.png` | `de69cc1d346b5f3f5a98476b20544a259323bc2d6a8b66c8f7b0ba63b8698c62` |
| `a-testers-dark-1280.png` | `92fd3da21f501d2a82b03a620d39f246886353ab63c7223c0424ac8d761e2eda` |
| `a-testers-dark-375.png` | `6dad54783d7470d4901e309564ccf8220f684afc2d848bd49f15cf1ebd68b81f` |
| `a-testers-light-1280.png` | `d962aa37baff9dd029cd6bef84917889f62137725db14876a03637790e9adc73` |
| `a-testers-light-375.png` | `bbf513c965fb6bf17b423a873bb22abf16b637c58a9a2064f69edca421915356` |
| `b-home-dark-1280.png` | `02a8d68be2edb7b3c4831ddb27b627835e3172358b7c6ed22d388bd96a633613` |
| `b-home-dark-375.png` | `da0227d8367f96c711d0f5848879d5deaa171046797cb0ec841cd9fca918173a` |
| `b-home-light-1280.png` | `9de07cfb59e48207c631c7d3da6d1004f498fd1114ffdb22a7e0e234ca176b60` |
| `b-home-light-375.png` | `5f7b03e9b51bef6e321d85c228363bedd6aeccab79a14cb73d2f549947808264` |
| `b-testers-dark-1280.png` | `6940487306c517651687bed668b7a35caf211a8879dc9cc040bf427dfdc3edf0` |
| `b-testers-dark-375.png` | `122c2e72c673eb5e3534471782fa7fe7608f66fa7e2366041204af2b44a83f19` |
| `b-testers-light-1280.png` | `5d2b0995fc3881a4cf859f11df87ea42acecd1bcc938a842b470951c00190f3e` |
| `b-testers-light-375.png` | `a40fbbc968e9f759af898e65f28ec056ee48921458eb741ecf2db77877258f42` |
| `c-home-dark-1280.png` | `55fe19cea6beed2c9b3c1335d0e8f3d824a13b99835a1e1eb77af8ce7409071e` |
| `c-home-dark-375.png` | `c69198ff67c91f4a2c018386175e760d9a81fcbc761f1293e33bd92585f9575e` |
| `c-home-light-1280.png` | `d84c2c09ee6cb979e77106dd0b57f1f156653917edfdee602cf4f3f287bf3839` |
| `c-home-light-375.png` | `59ac20b45614ea5addc0a77e0320c9ca3c0c74cd5e1de7a69cf7ca87ed4fc370` |
| `c-testers-dark-1280.png` | `56a75cb7a5f9d732deea0220a7b2f1c623a9e0d64e6e5f0a6310435c6c73e25e` |
| `c-testers-dark-375.png` | `cfc99938eded8a07b044e0838cd63c2c4481072aa740a9c737dd087be232c6c9` |
| `c-testers-light-1280.png` | `6e2c4e3a00c2f967509c9e9c8f2cfe0bbbac7a43a315dd8bad4957d0465ae26f` |
| `c-testers-light-375.png` | `ba239def9351771902bd3e4ad201a5c22ae51776c16e0fe64b7b4e684ada1619` |
| `d-home-dark-1280.png` | `4dec933e55021736beaede22ecb5ca27cf19e051026d63bd8f6b2cf8172aafd1` |
| `d-home-dark-375.png` | `c63dc3ff19aab62c00973a8a525b809203d1852b6f26b4628b44157fa4ec9f0a` |
| `d-home-light-1280.png` | `ac9db495fee48b335b2ad7552d355f94e39da6bd09d58975658087dfd6b4ffc8` |
| `d-home-light-375.png` | `9374998fbc30302bab372c21735f6fbf7ba6c834fbbb489642607ece2e8c82bf` |
| `d-testers-dark-1280.png` | `30d2896c49a922af25fb68e9072127e284f2ada5b095f63f104ecbd64045a9f7` |
| `d-testers-dark-375.png` | `4b0bd820cff153e134e23a6c2b9523278ccfb33b82f0f44fc2022f6040137771` |
| `d-testers-light-1280.png` | `8f486ab393aafb10c13c32da561014caffb092e43cde2d853b28caef8e1588ee` |
| `d-testers-light-375.png` | `6f866e527cca17860b4849fa381f27a796ef88fd959e4d830aa6a1a837b80f0a` |
| `e-home-dark-1280.png` | `292e7c06fdf276e5b8a6ca0bf51761a692898868496cbe405a40e0951cec0ea4` |
| `e-home-dark-375.png` | `c073a62fbb8c73bd669b983b3715958e7e02bf1a2a946187f54e69b463d52f8f` |
| `e-home-light-1280.png` | `afe3c05e25012190a11e339952bfcfdee8665963e156504cb08c6cbfc9f2d8c5` |
| `e-home-light-375.png` | `238b2014b4600e7303daa0c12850c5c75626b19b0b1d2306f494b63da7235469` |
| `e-testers-dark-1280.png` | `73cbd333fac168fb158bd7036e38da06d34ba967fe3423cfffb1ac6f32d909b9` |
| `e-testers-dark-375.png` | `57dd229c3a3dd933066abe6512b9527f5c2b7ca10f78c06a527e2ba7a9a108ac` |
| `e-testers-light-1280.png` | `dcf4163b22a68e9b4512a50d70203e97b8e413be1987e1d7cc633c95a0b1b7cd` |
| `e-testers-light-375.png` | `83e928112dc37a45ffe918f95e4fab19c7e581119379e0a263567b921faca880` |

Inspected directly on both pages, both widths, both schemes. One defect
found and fixed before this record: E's injected figures applied to both
pages and fell into the wrong grid cells; the operations are now page-scoped
and the cells placed explicitly. E was re-captured after the fix.

## Fidelity limits

As in rounds 1 and 2: a capture of the production HTML, Chromium only, no
CMS runtime. The pick is implemented in `src/styles/site.css`, the block
components and `design.md` v1 afterwards and verified on the real build.

## Outcome

Pick: B's composition across the board (maintainer, 2026-10-01), with the
graphite band fill itself still not loved. Round 4 locks the composition and
varies the band surface: `look-round-4-captures-20261001.md`.
