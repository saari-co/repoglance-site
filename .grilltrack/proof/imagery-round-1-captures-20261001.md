# Imagery round 1 captures (2026-10-01)

Decision `site-imagery-007` (the imagery of repoglance.com), reopened by
the maintainer on 2026-10-01: "the only thing I don't like about the site
now is the imagery; it's all focused in on sample data stuff; I'd prefer
if the imagery used other mock data, sample data should just be for
testers; also the images in the slider are mostly cut off and don't
correlate to what they need to." Offered site-side renders, framed
recaptures or an app-side showcase, the maintainer chose "3, use an
emulator". Branch `claude/site-copy` in worktree
`~/Developer/side-quests/repoglance-site/.claude/worktrees/charming-hertz-56ba49`.
The layout (design.md v2), the copy (site-copy-006), the mark and the
system fonts are locked; the open slot is the imagery: which capture each
slot shows, how it is framed and cropped, and whether it follows the
colour scheme.

## Source imagery

`saari-co/RepoGlance` `showcase-048` (branch `claude/showcase-mode`,
commit `bbce61a` plus the review fixes): sample mode rendered without the
SAMPLE marker under the fictional owners `saltmarsh-io`, `ferrywood` and
`elin-tidewater` (each a 404 on GitHub on 2026-10-01), captured on the
approved emulator's cover display (1080x2364) with the SystemUI demo clock
at 9:30 and the device clock set to match, dark and light. Proof in that
repository: `.grilltrack/proof/showcase-048-verify-20261001.md`; files in
the private release
[`repoglance-showcase-048-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-showcase-048-20261001).
No capture shows a real account's data; no screen carries the word
sample; the Connect screen is the same screen the Play listing shows.

`build-assets.py` cuts them into the site's assets under
`.grilltrack/work/imagery-round-1/screenshots/` (46 WebP files, 540 and
1080 px wide, dark and light): six phone frames (9:16 crops of the cover
display, the home screen offset so the smartspace, both widgets, the
hotseat and the search bar stay in frame) and six cut-outs (the two
widgets together, the Pinned repos widget, the Repository widget, the
catalog rows, the repository rows, the Quick Settings row with the tile).
`screenshots/manifest.json` records every file's SHA-256 and size.

## The picker

Development-only sidecar under ignored `.grilltrack/work/imagery-round-1/`
(never shipped), served with `python3 -m http.server 4355 --bind 127.0.0.1`
from that directory and opened at
`http://127.0.0.1:4355/?c=a&p=home&s=system`. Same controls as the copy
rounds (buttons, keys 1-5 and arrows, P, S, H); neutral labels;
`picker.json` validates with GrillTrack's `validate_picker.py`.

The canvas is the production build of `claude/site-copy` at `c0df035`
(locked layout and copy) saved as `canvas/home.html` and
`canvas/testers.html`. `engine.js` is the copy-round engine extended with
the image slot: it rewrites every block from the candidate's seed and
renders each `figure.shot` the way `Screenshot.astro` does (src, srcset,
sizes, width, height, alt, loading), with the candidate's config choosing
the dark asset or a `<picture>` that follows the colour scheme, and
injects the candidate's CSS. **Fidelity check** (`?selftest=1`): the
shipped seed with the shipped images through the mirror equals the
untouched canvas on both pages (`home=identical testers=identical`).

| File | SHA-256 |
| --- | --- |
| `index.html` | `9b1877ac418f450ed8de50f53f82de0863f16eaa7b5bafe2a52c7ba8d6256e82` |
| `engine.js` | `64781d5b5765da28b44c489769b88ab00ee610faf0e95c979853d26c722df9b9` |
| `scheme.css` | `7cbf4a8d0f071a7083f88972b0659aaf34b3f21998512f54b1a894ab790d8ee0` |
| `picker.json` | `3bb7f31da57b2c9cb6c57afd152c08a60ac3fb185ae92c280c397550ac006f91` |
| `alt.json` | `fd68a32f251fcdbfee302b605f3225384e1c1fd7ec4a7b109221e0523679568d` |
| `build-assets.py` | `d0a1d4131bb22845dfe5f19cea76edbb23008d367ea331d315bf112e355f8bc9` |
| `build-candidates.mjs` | `0c42300d09d4f60472ecf915734ae832209789b821c94d3c1b6df9586dd58c3a` |
| `candidates/a.json` | `2818f593787d9d72406aff1fb1c4473d4b7a5eca0826fa7af36c1298e1c3a479` |
| `candidates/b.json` | `2818f593787d9d72406aff1fb1c4473d4b7a5eca0826fa7af36c1298e1c3a479` |
| `candidates/c.json` | `c7a722a2a07b4392d30f6ffe5f81e3ef15f20e2ae8aa50756616ebee8f935d30` |
| `candidates/d.json` | `2818f593787d9d72406aff1fb1c4473d4b7a5eca0826fa7af36c1298e1c3a479` |
| `candidates/e.json` | `b5f01c5ae320bf3c23734ab163b6e6c9020a5eb511442abd1261d4c9337a9a01` |
| `candidates/b.css` | `478bad59fe8dea166f1b55119463f93a59ac6deebc99c386ec0ec1ae4a0650f9` |
| `candidates/c.css` | `31a2dcea77a2f2db5ccb264f0eccee5c13b9285ac646973351fd8264f453068f` |
| `candidates/e.css` | `61d89395c70e26e25d0b7abd6ad7b8fedb55ae742839e36130bd6b08aa14d760` |
| `canvas/home.html` | `ca2798a43a24814081245668acdfbf068a3a75fac21fef100679d100708999db` |
| `canvas/testers.html` | `0ca3f5cb558fc4e5ebb2addb1d055e13df63fd545a5bef877ab47cf21112a472` |
| `canvas/shipped.json` | `1117cf9b3bb7c353cc12398a03bcb86f3f68ae235e519dcaf7951993bf6f5e28` |
| `screenshots/manifest.json` | `19e2e88a2519515b0886ce49386c77e559ba7432911d6b92b947f37e54aca9fd` |

## Candidates (seed deltas plus framing on the shared canvas)

Every candidate keeps the block structure, keys, links and copy; it
changes only each slot's `screenshot` slug, the asset scheme and the crop
rules. All five put the home-screen widgets on the "On the home screen"
card and the tile on the "In Quick Settings" card, which the shipped seed
did not (its first card showed the catalog and its third the Quick
Settings clock).

| Id | Label | Hero | Cards (home screen, in the app, Quick Settings, before sign-in) | Framing |
| --- | --- | --- | --- | --- |
| A | Phones, top crop | home screen phone | home screen, catalog, Quick Settings, Connect phones | the shipped framing: cards crop the top 280 px of each phone; dark assets |
| B | Phones, aimed crops | home screen phone | same phones | cards 320 px tall, each crop aimed at the element the card is about (`object-position` per slot); dark assets |
| C | Cut-outs | home screen phone | Pinned repos widget, catalog rows, Quick Settings row, Connect phone | the element itself cut from the capture, with its own corners, instead of a cropped phone; dark assets |
| D | Scheme-matched | home screen phone | same as B | B's crops, every image a `<picture>` that shows the light capture on the light scheme and the dark capture on the dark scheme |
| E | Widgets first | the two widgets cut from the home screen, no phone chrome, 360 px | Repository widget alone, repository view, Quick Settings, Connect phones | B's aimed crops on the cards; dark assets |

The join page's hero shows the Connect screen phone in all five (D's
follows the scheme).

| Id | Delta | SHA-256 |
| --- | --- | --- |
| Ua | `candidates/a.json` | `2818f593787d9d72406aff1fb1c4473d4b7a5eca0826fa7af36c1298e1c3a479` |
| Ub | `candidates/b.json` | `2818f593787d9d72406aff1fb1c4473d4b7a5eca0826fa7af36c1298e1c3a479` |
| Uc | `candidates/c.json` | `c7a722a2a07b4392d30f6ffe5f81e3ef15f20e2ae8aa50756616ebee8f935d30` |
| Ud | `candidates/d.json` | `2818f593787d9d72406aff1fb1c4473d4b7a5eca0826fa7af36c1298e1c3a479` |
| Ue | `candidates/e.json` | `b5f01c5ae320bf3c23734ab163b6e6c9020a5eb511442abd1261d4c9337a9a01` |

`tests/content.test.mjs` on each candidate seed: 8 of 9 pass; the ninth
("every screenshot reference is a shipped sample-mode capture") fails for
all five because the new assets and their alt text are not in
`public/screenshots/` and `src/content/screenshots.ts` yet; that lands with
the lock, together with the test's name and rule (showcase captures, not
sample-mode ones).

## Captures

Full-page renders as in the copy rounds (`scripts/capture.mjs`,
`FULL_PAGE=1`, 375x812 and 1280x900, `prefers-color-scheme` emulation,
picker chrome hidden), renamed to `<candidate>-<page>-<scheme>-<width>.png`.
Files are in the private asset release
[`repoglance-site-imagery-round-1-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-imagery-round-1-20261001)
of `saari-co/swarm-pr-assets` (40 assets).

| File | SHA-256 |
| --- | --- |
| `a-home-dark-1280.png` | `c68a48472d52dadf069ca5329b5e4ea1fed79d1324ef29d6dec629992d0ff1a7` |
| `a-home-dark-375.png` | `6bfa1b58be5216c2e2828cb48fc5eaabf7ab94424f84e5f40ca9a152fc69f27d` |
| `a-home-light-1280.png` | `81b510c0d3f6491fb3b76c1e4fc46593c2d385442bdde6731d7ed20612122aef` |
| `a-home-light-375.png` | `bd9554fc2ae0521346a2d6493d7dadfb9d434b74285d80d9047cefe540e170f5` |
| `a-testers-dark-1280.png` | `7930ecd282248eb23ab0d037dd8e86edef240bd83a07b6fa9317ed9254207351` |
| `a-testers-dark-375.png` | `f3a6017d64c1458bd87b11408c03f79ee120b6e5abd7c66eef4b04e889446cf2` |
| `a-testers-light-1280.png` | `e632916a26d8456dbef5af6720ca08925e7d15bfe7c5035425c075f1c02f5a04` |
| `a-testers-light-375.png` | `a9f2714badac53c7bedadc4b0457c730b5a8e43a3ea6964dfb55aaf412f08a98` |
| `b-home-dark-1280.png` | `30f8249ba911359c3bad6b823157576b01b693eb03556773e033e47071914a49` |
| `b-home-dark-375.png` | `15f3255353e26444896e197f43436a595dc400e70a568fdc92d7db39bcd9fa1d` |
| `b-home-light-1280.png` | `11357ab16101a00b32aac8e884a727b13f143f6d73c969e485f5d8c45abac23b` |
| `b-home-light-375.png` | `42bbe16111ff43cd65a2545c6b3426c4f1587f20845720ffb2c5801aeffbcb1a` |
| `b-testers-dark-1280.png` | `7930ecd282248eb23ab0d037dd8e86edef240bd83a07b6fa9317ed9254207351` |
| `b-testers-dark-375.png` | `f3a6017d64c1458bd87b11408c03f79ee120b6e5abd7c66eef4b04e889446cf2` |
| `b-testers-light-1280.png` | `e632916a26d8456dbef5af6720ca08925e7d15bfe7c5035425c075f1c02f5a04` |
| `b-testers-light-375.png` | `a9f2714badac53c7bedadc4b0457c730b5a8e43a3ea6964dfb55aaf412f08a98` |
| `c-home-dark-1280.png` | `9a13de6e876771b196865a06267e01c52ee4d680cc3f7403c6aea90b9f3a66ab` |
| `c-home-dark-375.png` | `d8dcae86ff22fc49ba869bc547d3456b9a7fc3beed7178a4b0cded8d9427d748` |
| `c-home-light-1280.png` | `fe86e68d94fafa5e5c5cd3d2107a51ff0406105a1b71131eddbe77704c1e6591` |
| `c-home-light-375.png` | `ccfcb8820de58d891cb140171b648b56a8f1a8387e52b8d7e3619f28dca3aa0c` |
| `c-testers-dark-1280.png` | `7930ecd282248eb23ab0d037dd8e86edef240bd83a07b6fa9317ed9254207351` |
| `c-testers-dark-375.png` | `f3a6017d64c1458bd87b11408c03f79ee120b6e5abd7c66eef4b04e889446cf2` |
| `c-testers-light-1280.png` | `e632916a26d8456dbef5af6720ca08925e7d15bfe7c5035425c075f1c02f5a04` |
| `c-testers-light-375.png` | `a9f2714badac53c7bedadc4b0457c730b5a8e43a3ea6964dfb55aaf412f08a98` |
| `d-home-dark-1280.png` | `30f8249ba911359c3bad6b823157576b01b693eb03556773e033e47071914a49` |
| `d-home-dark-375.png` | `15f3255353e26444896e197f43436a595dc400e70a568fdc92d7db39bcd9fa1d` |
| `d-home-light-1280.png` | `1ecff163b05f26eccfc7a2426ce144daebcdce6bccb96923ac025ffb3fae0541` |
| `d-home-light-375.png` | `b6e2345951f257fe597d50d478d1acb403aa94808ea6caa886d7e49f0ea9f795` |
| `d-testers-dark-1280.png` | `7930ecd282248eb23ab0d037dd8e86edef240bd83a07b6fa9317ed9254207351` |
| `d-testers-dark-375.png` | `f3a6017d64c1458bd87b11408c03f79ee120b6e5abd7c66eef4b04e889446cf2` |
| `d-testers-light-1280.png` | `de7ac09f87daf1101a894f0bf3386493e5ae4646cfc12894df59a832e58a4929` |
| `d-testers-light-375.png` | `1838e4ad105ceace01383b71e6537257c3eb1d8bd96d3dcb1d47dc23e0673dfc` |
| `e-home-dark-1280.png` | `858b6464c266c795b3a0286bd6acbcdbec4b0d0e33c74d6cf16b9fc4979480b1` |
| `e-home-dark-375.png` | `a3a03aa60b8457792ad45140836ae43551fe3150f9bbd8eb3b5045fea8d0b80c` |
| `e-home-light-1280.png` | `bde689f5443d26d7a404d4b77f7ddae5221d3d9f17022e6bae75dd89f411f107` |
| `e-home-light-375.png` | `b1624ff55ea3190fe06b8bbec101da9d558c067589dcede492ec955df186625e` |
| `e-testers-dark-1280.png` | `7930ecd282248eb23ab0d037dd8e86edef240bd83a07b6fa9317ed9254207351` |
| `e-testers-dark-375.png` | `f3a6017d64c1458bd87b11408c03f79ee120b6e5abd7c66eef4b04e889446cf2` |
| `e-testers-light-1280.png` | `e632916a26d8456dbef5af6720ca08925e7d15bfe7c5035425c075f1c02f5a04` |
| `e-testers-light-375.png` | `a9f2714badac53c7bedadc4b0457c730b5a8e43a3ea6964dfb55aaf412f08a98` |

## Inspection

Inspected directly: A to E on both pages at 375 and 1280 px in both
schemes. No overflow at 375 px; the locked composition holds in every
candidate; the hero phone and the join-page phone keep their sizes. C's
first Quick Settings cut-out was too tight (the tile's label was cut), so
the cut-out was widened to the three tile rows and C recaptured; the
hashes above are the recapture. E's hero without a phone sits in the
band at 360 px and reads as the widgets on a dark wallpaper.

## Fidelity limits

As in the copy rounds: the production HTML with the deltas applied by a
component mirror, Chromium only, no CMS runtime. The images are the
site's own future assets, served from the sidecar; D's scheme switching
uses a `<picture>` element that `Screenshot.astro` would gain at lock.
The site build is not part of this round (see the note in the ledger's
next safe action about the Astro build).

## Outcome

Open. The maintainer judges the five in the live picker and answers per
candidate or per block; a mixed answer becomes a shared base for a second
round or a precise hybrid preview. Nothing is locked, written into
`seed/seed.json` or `public/screenshots/` by this round.
