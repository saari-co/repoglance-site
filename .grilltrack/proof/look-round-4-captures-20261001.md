# Look round 4 captures (2026-10-01)

Decision `site-look-005`, fourth round. Round 3 ended with the maintainer
choosing B's composition across the board (2026-10-01): "I like B the best
across the board now, still don't love the graphite banners but we're
getting close." The composition is locked; the band surface is the open
slot.

## Shared base (locked by rounds 1 to 3)

`candidates/base-r4.css`: the round-3 base plus round-3 B's composition
(band call to action on home, phone right of the text in the join hero,
feedback and privacy in a closing band). The band colours are variables
(`--band-bg`, `--band-fg`, `--band-muted`, `--band-line`,
`--band-button-bg`, `--band-button-fg`, `--band-edge`) so each candidate
is a surface delta only.

## The picker

Development-only sidecar under ignored `.grilltrack/work/look-round-4/`:
`index.html` (sha256 `33a715639401588d2fa3e2f3924fc841d9c4a213cd2ee4450e230ee834745b8c`), `engine.js` (sha256 `3440ad5be2c7006d18dbdfddd3ce3bbc1fa9d20b106c8f5cd7443c987346f7e9`),
`candidates/`, `picker.json` (validated). Served with
`python3 -m http.server 4353 --bind 127.0.0.1`, opened at
`http://127.0.0.1:4353/?c=a&p=home&s=system`.

## Candidates (the open slot: the band surface)

| Id | Label | Light scheme | Dark scheme |
| --- | --- | --- | --- |
| A | Ink, flat | Flat near-black (#1b1d21) band, white type, white buttons. | Flat near-white (#e7e9ee) band, dark type, dark buttons. |
| B | Tonal surface | Cool light grey (#e9edf3) band in the page's own scheme, ink type and buttons. | Raised dark grey (#1d2026) band, light type and buttons. |
| C | Deep accent | Deep night blue (#10213f), white type, white buttons. | A shade darker (#0b1830). |
| D | Hairline, open | No fill: page background framed by hairlines, ink type and buttons, the phone the only dark element. | Same, on the dark page. |
| E | Graphite flat, mark | Flat graphite (#1f2327), white type, the commit-eye rings as a faint large motif at the band's right edge. | Flat #1a1d21 with the same motif. |

| Part | File | SHA-256 |
| --- | --- | --- |
| base | `candidates/base-r4.css` | `20e2cb1b23a77e58917b5a23115c6f2e5ee63bbd87024343b5e2ab2fc50411bd` |
| A | `candidates/a.css` | `b45d0fd2ef5c5d1645887dd64ef65d8564f24ba0cf2b965c290336b7fd3b7eb4` |
| B | `candidates/b.css` | `dc334b124caaae862d5b6d167457ad3738ff00b28411b5e698740752f4582618` |
| C | `candidates/c.css` | `700484d3de4f03e805979db34abcaa0fde8e79150d8c55bc122ef04ea00b0cff` |
| D | `candidates/d.css` | `5a2a300205894f89f175e23d0a8bb993df80faaff35a446034c00a788ecdf297` |
| E | `candidates/e.css` | `9a748f596844c0a8eae52a2f0a38a70ab6cebafd21fafc323a9380b574167a84` |

## Captures

Full-page renders as before (`scripts/capture.mjs`, `FULL_PAGE=1`, 375x812
and 1280x900, `prefers-color-scheme` emulation, picker chrome hidden). Files
are in the private asset release
[`repoglance-site-look-round-4-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-look-round-4-20261001)
of `saari-co/swarm-pr-assets`.

| File | SHA-256 |
| --- | --- |
| `a-home-dark-1280.png` | `70ce4103f2f339b00760d20ba01d43348b99879ef7bfac3afa53a37415f533cd` |
| `a-home-dark-375.png` | `b10bf4d6da0bec43f3a4ab157083c9dc987d2c8975fba12ebdf5a614e3e3bd0f` |
| `a-home-light-1280.png` | `94cad8caf20871b3d5ab02384f8cf641ebc47037ed594319b9a5b97a256b11b7` |
| `a-home-light-375.png` | `52d6da3cc2334d076cc64f0741a98589a7699c6f8e57f16d6d0ed5dacd6b3d1e` |
| `a-testers-dark-1280.png` | `a5b95e8f575eda6bd9b99ed6a5291c746d6fad689fea14a37530e6a462a643df` |
| `a-testers-dark-375.png` | `a2280351fad0b32b62b35d51c0b22a296aa27b2517ecbe7dd4e9d9c17f880df3` |
| `a-testers-light-1280.png` | `3e5629e53719d65d9a718b463e0c5a2aadbf1682e5d380e042df24d0a137a4dd` |
| `a-testers-light-375.png` | `6b33df6278354c44254417f8049ae1744afdc98ab32788b443266f226c4a3008` |
| `b-home-dark-1280.png` | `ac94b4ce89d0a58e7d789354c773e580edb637b10685b8b654d09516427ae0ff` |
| `b-home-dark-375.png` | `4aa60f9c3f5d77efccb728e3f8e4119aafe87b5539fdb5a24ca26690c2ea37a4` |
| `b-home-light-1280.png` | `2b48e328c138ea7a689fce1a5bde3ac46a5200a3677241c9295594ac233e9f55` |
| `b-home-light-375.png` | `803fe566bb6828ffe20090d776ed9210042e72452a5c1ec3ecd10068a0a247e8` |
| `b-testers-dark-1280.png` | `25ff570e2d34d4e8a35414aaf0282b39fa8f4f2ff90d072facba16628ad48a36` |
| `b-testers-dark-375.png` | `49d8e2f789c749db35f496220f1b0712ba651d877481373cf57b69762253e88f` |
| `b-testers-light-1280.png` | `8547b1d587b6883472389b517021fabdea79a58eba1d57ce6b7aa791320a3201` |
| `b-testers-light-375.png` | `24fb0e30b75634e9c13339d6dc52a7b24f79fda09fb21a893f117ea541e1e942` |
| `c-home-dark-1280.png` | `3286da44d78af188b5c794ea5d79317165f689188320e130abf6dd2629819fdc` |
| `c-home-dark-375.png` | `84bc24e468e4ac79466b0e050ba086d3e28ecf570a1bc50250d0cf1047735389` |
| `c-home-light-1280.png` | `62fec6b28fcf156392cf540052f798def643b8f1617771cc3c75ee6dc6f8a752` |
| `c-home-light-375.png` | `2ddf486bca718f05dfee534f10ee12c94ec1962fffcdc462043b030710aafcc5` |
| `c-testers-dark-1280.png` | `be1efd9af12f87c9c5afde576f09cef0816f364c23cd64cd1f5e3631b9530331` |
| `c-testers-dark-375.png` | `96bffa3a9cfe0e614cbd9853242cd9d5827843e9a6b6466d0b3a35729157ae8c` |
| `c-testers-light-1280.png` | `c0bc367540e5ef998d43a18d64a4f122eb10fdede7ac5bb21e2a9eb86dcda7d5` |
| `c-testers-light-375.png` | `c9100fef10f506e8ff6fa962de2e4c3cfdc6bdcd4ea3d253b332ef0ae25b1ff1` |
| `d-home-dark-1280.png` | `e47bdb61ea088a90bc7439171d1e7a5125d49504088340581c249548f943056f` |
| `d-home-dark-375.png` | `97694bccd1bd72d03850f643874f499cf7603c1844f64eafd0443739f45b2ed3` |
| `d-home-light-1280.png` | `c6ec07d3eaafba6d709e958603f954ad9cec524b1420e609ad8eebdec5f548d6` |
| `d-home-light-375.png` | `2771e18d40022f7432e127c3928eff9bb5976e84384a39c45ff48d17cdb9fac8` |
| `d-testers-dark-1280.png` | `e9c859c7eff68a8e9f8ca14d041e8e1463d41d941a491ba5ff078db586c3e15d` |
| `d-testers-dark-375.png` | `e1e0da61bd744f2cd76c8524558aac038458f248b93b9ddc080df9fbaad71554` |
| `d-testers-light-1280.png` | `d22fbc7813c1fea2bbbc9825d2ee2a667e4864d1f344a7dd644fccedd6a9c2bd` |
| `d-testers-light-375.png` | `cc2a7186ec7dd71ba502bdff366f626da45d030d5249a96c6f64ca22f2bdbeac` |
| `e-home-dark-1280.png` | `1930ab2f417e5cfaadce39e64988a7b6923f6db9ffa320ed823ba8c18c5e39c2` |
| `e-home-dark-375.png` | `2197229a26510a143fb2c671da9a332e6a1feac3c7b4cb2e61add39831ff658f` |
| `e-home-light-1280.png` | `4a0d61ec2d574bc3bffa475b2bc16d3aa4297757ac8a20e00c79d1c02aaf2b3b` |
| `e-home-light-375.png` | `18e4a03b4a01774d3b423d4c17a6d8ccc47c6568963af0979dd2bba6d9afb411` |
| `e-testers-dark-1280.png` | `5700687e061622f3e4ade4131b9e65f64a2b654137a8aa8e42c2b0560a95c981` |
| `e-testers-dark-375.png` | `d7de1a7331fbb936684c8dda93bef1229816a46b25b74645bd2eb3eed92ec9de` |
| `e-testers-light-1280.png` | `0e0a0003bc88130a8435ac70f76cc11a08e52991f83f48abf6a5f328399db447` |
| `e-testers-light-375.png` | `0a3494d67424e95e05412aa394df5ee263f445b34eb738c788793844b7e4aaf6` |

Inspected directly on both pages, both widths, both schemes; no defects
found in this round.

## Fidelity limits

As in the earlier rounds: a capture of the production HTML, Chromium only,
no CMS runtime. The pick is implemented in `src/styles/site.css` and
`design.md` v1 afterwards and verified on the real build.
