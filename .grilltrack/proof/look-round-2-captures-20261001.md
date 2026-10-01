# Look round 2 captures (2026-10-01)

Decision `site-look-005`, second round. Round 1's five candidates were
replaced after the maintainer's feedback (2026-10-01): "I like the
full-width hero on the homepage for E, but I like the slider on the homepage
for C; on the join page I like how condensed A is; I also like C on the
join test page but the 'what this build does' section is terrible; also
like the full-width band hero on the E join page; use that feedback and
let's go for a round 2."

## Shared base (locked by that feedback)

`candidates/base-r2.css` plus two engine operations applied to every
candidate: the full-width graphite hero band (from round-1 E) on both pages,
the snap-scrolling feature row (from round-1 C) on the home page, a
condensed join page (tighter hero and section rhythm). No candidate uses a
tile grid for "What this build does".

## The picker

Development-only sidecar under ignored `.grilltrack/work/look-round-2/`:
`index.html` (sha256 `10544e91c10905e81e5740e0a39bf7d26d62aa1a575f55546211c35754c77715`), `engine.js` (sha256 `9b2914206ac4ec0734242d81a5d3dc8f33fab283edee22ba4a4e24c4b63f8adc`),
`candidates/`, `picker.json` (validated). Served with
`python3 -m http.server 4351 --bind 127.0.0.1`, opened at
`http://127.0.0.1:4351/?c=a&p=home&s=system`. Same controls as round 1.

## Candidates (deltas on the shared base)

| Id | Label | What varies |
| --- | --- | --- |
| A | Hairline mono | Monochrome ink, mono navigation and footer, hairline-framed slider cards with mono heads, dash-prefixed section heads, hairline fact and step lists with mono step numbers, plain call to action; the join page is one 680 px column with no phone in the band. |
| B | Tonal | Pill navigation, borderless tonal slider cards, a tonal fact band with accent dots, a blue call-to-action card; compact tonal containers on the join page with the build list in two columns. |
| C | Centred | Centred headings and copy under the band, hairline check lists instead of tiles, a graphite call-to-action band; the join page is a centred 672 px column with the build list as a mono checklist. |
| D | Dense | Compact rhythm (15 px base), a mono status strip under the header, a shorter hero, hairline-celled slider cards with mono heads, a three-column hairline fact list, a compact call-to-action box; dense mono rows on the join page. |
| E | Bands | The bands continue: slider cards with shadows, an inverted facts band, a blue call-to-action card in its own band; alternating surface bands on the join page with the build list inverted and in two columns. |

| Part | File | SHA-256 |
| --- | --- | --- |
| base | `candidates/base-r2.css` | `d3e245d28b1779b54fd5a30eecb833a8fabbd96c91d6cd32f25c0c505f93ddfc` |
| A | `candidates/a.css` | `2c1e3e62ef220dde05519c696d4a08a678760b1413290c0c3b23bf9f3aca4219` |
| B | `candidates/b.css` | `84c74066c7d12a9f603bb2eee9e3b712f0e103d17af14e2262449bae85c29b34` |
| C | `candidates/c.css` | `fcfd75356811aa483543a6fdd164e6b7be9decbd4ceb23877ced0ed00eef7dc3` |
| D | `candidates/d.css` | `46ce6e6df84cae830c371f532a52808e0c84d671ea8ab7b644a8bc4db4d979ce` |
| E | `candidates/e.css` | `8ea3fa1651122119308ff647a43dd057f3946dd2895ef610a34ad29b519b5622` |

## Captures

Full-page renders as in round 1 (`scripts/capture.mjs`, `FULL_PAGE=1`,
375x812 and 1280x900, `prefers-color-scheme` emulation, picker chrome
hidden). Files are in the private asset release
[`repoglance-site-look-round-2-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-look-round-2-20261001)
of `saari-co/swarm-pr-assets`.

| File | SHA-256 |
| --- | --- |
| `a-home-dark-1280.png` | `66ff830cf6d6d2b4a826b2300bb11423d1876ad942f03d74d0b3b9150cc4cb2a` |
| `a-home-dark-375.png` | `6102e649cc0fa251cf14668752f06db919d7453c25bd30fd61db0ffa4f0ecdd6` |
| `a-home-light-1280.png` | `7b462f424f7204dcaf4cd7f0fd2215256f5dc45e76356e09022f6f10d72c89a2` |
| `a-home-light-375.png` | `b24fd641b57c2bb139d3f68d0e46e548e77f5027bacba855bc6cdc52917315c0` |
| `a-testers-dark-1280.png` | `1c1d9e312e1446b9fa5700b3cdb162b0282230a235f5f9a1fadc58428ccee564` |
| `a-testers-dark-375.png` | `91bf14bef7a8dce7e5109efc093280dbfc01068bbcd12db6a53c234e807b0bc2` |
| `a-testers-light-1280.png` | `0502a5fe120d9f02e788ac306ba4edb0b2cd9dae7de5b424d80093db08e08e8f` |
| `a-testers-light-375.png` | `7bb1bce53058429ab2d84371ba86bdc85db523129e21f26cced05f8ba7b50d97` |
| `b-home-dark-1280.png` | `a07da23bc6bb80d3c22a152794b0a2f8b6e39985c5320b36ad8162d1a21a6167` |
| `b-home-dark-375.png` | `ed7a7051560f45101289b74c5a931afd3811671f684eaa64805a9476750c6521` |
| `b-home-light-1280.png` | `a52d9db9b6defa3332b1d5f86a63af521dd50ad65bd28ad3d81e1e9eaff4d7ef` |
| `b-home-light-375.png` | `b29859821a906999af8339944e3a09c636028d6ae79d4fc5b13ef53d5bb192e2` |
| `b-testers-dark-1280.png` | `f77f1f13eccf9ee3b2d869fe99cba6ea49abb65ba62f008b027170f2857f0f59` |
| `b-testers-dark-375.png` | `dc1d2767224985ab23eb055d65b11e0ba1690d73eff718f4e9e9beca810287c8` |
| `b-testers-light-1280.png` | `e6d1b176354b36f4ec28bc21c8789bbf24d408183328b378bdac8998cc1c9db7` |
| `b-testers-light-375.png` | `76487d4fafc979b7a8628e35e7d868be29c8b8d1309e70733aa92a84b5e0bcf6` |
| `c-home-dark-1280.png` | `7e275865bd2ef0d9f46eeef29c51ab13da5471d218abb3916087760821dbd321` |
| `c-home-dark-375.png` | `ea72ceb7d1e3be7e5a37e97e1ab2d9df5cbbfc9aad7ba9647ceb3b82f6c572c5` |
| `c-home-light-1280.png` | `8c1aa8c52dc97c571954c1d59e56afe06294776d97b9523a8530f646f14540a1` |
| `c-home-light-375.png` | `6f31f6c763c1bc772a78954ffc3c9fb72425efff1d3dc0167cb3fe702183aa5f` |
| `c-testers-dark-1280.png` | `fac04dada8d2a324c6ba43264174eb0ffc4ac4b42b7d1213ce8e65a4535e7eb0` |
| `c-testers-dark-375.png` | `bb7b10e0c6a2c2be0f29524f516dc1c17c2148e1b67dc7f1115171b20975cb55` |
| `c-testers-light-1280.png` | `3324cf1bac01256ccf933d7e519c37813190ecb2aeb0575406ff161fcf67469a` |
| `c-testers-light-375.png` | `e694e4ee67da7d3612253e454589b8f423a9928c0e06cc20173c8c41ba7c0f3b` |
| `d-home-dark-1280.png` | `e5e0367b21adf684d2adb2c0cdc1345bdc474e729c9dbf5aea148d516af10d6f` |
| `d-home-dark-375.png` | `e3958dc84eccada06b4eeccc072806a60050bb3783a09bbfcd5cea5b144cb3b2` |
| `d-home-light-1280.png` | `b08ab2fd518e615c3e796bfd32160fce2bf2922061e222c26e27d3200cc5ad1d` |
| `d-home-light-375.png` | `9abc348ee9314c2fdf8bb5ebd65fbe730ab6f3e964499532e3e4a525a1e6787d` |
| `d-testers-dark-1280.png` | `d97a83e4229fb27544fd89ec9dee6ffd053e6643fa48205f09a167c5f8fa7097` |
| `d-testers-dark-375.png` | `0ab2e25537554ad02b4df270fe1ef895b16aef8df0f714b2f1524e22709bfc1e` |
| `d-testers-light-1280.png` | `187660cc5b4a716381e557d1b6797c340e86bdbbb638cd8718e2cce0971cb6db` |
| `d-testers-light-375.png` | `56c706747bcd9d2507c25c68b9d2afadf8785840bb2d76c677f815be4aa68dbf` |
| `e-home-dark-1280.png` | `89347947657d84b0d5364d24ed98f3815f9083eda351cc8b366564a6fb452517` |
| `e-home-dark-375.png` | `2c72de781a00d9e6151204e1bf51df1e69f0f9377e12079913fb1c8d6a29e015` |
| `e-home-light-1280.png` | `8312aad28a6fb2600ea844f63e8bbe1548b69d7608625c8d04c66d6da52641aa` |
| `e-home-light-375.png` | `2de4756e727a543505c97450d19f05d94d06bc3ae332c78aa72d14378378c97e` |
| `e-testers-dark-1280.png` | `747edfcf3416227f9b71d0d50fcd232a7bd3989ef6ddbed769fe6dbe253b9fb9` |
| `e-testers-dark-375.png` | `7a5e3a8735971ff13b0cc8e53b390573675bde01cb76fd49e0a83465b7baeada` |
| `e-testers-light-1280.png` | `2d91013df2aa0cb6dd8addb4af556c391ed646d210ba508e0e50f174a71834fa` |
| `e-testers-light-375.png` | `1b926688526628e51cd6a41d9bba19b84ca8aaa837c579c318daef4c8cf74856` |

Inspected directly on both pages, both widths, both schemes. Two defects
found and fixed before this record: A's band buttons inherited the ink
palette and A's numbered step rows broke their link into a narrow column;
B's secondary band button lost its text on the light surface. Captures were
re-taken after the fixes.

## Fidelity limits

As in round 1: a capture of the production HTML, Chromium only, no CMS
runtime. The pick is implemented in `src/styles/site.css` and `design.md`
v1 afterwards and verified on the real build.

## Outcome

No pick. Feedback (2026-10-01): on home, A's hero and slider and C's
centred fact list stay, no call to action convinced; on the join page, A
looked broken, C was the favourite but needs B's imagery, nothing else
convinced. Round 3 locks those parts and varies the call to action and the
join page composition: `look-round-3-captures-20261001.md`.
