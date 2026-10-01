# Copy round 1 captures (2026-10-01)

Decision `site-copy-006` (the copy in the locked layout), the first copy
round for repoglance.com. Branch `claude/site-copy` off
`claude/site-foundation` at `174064e` (the ledger commit after
`site-look-005` was reviewed clean), in worktree
`~/Developer/side-quests/repoglance-site/.claude/worktrees/charming-hertz-56ba49`.
The layout (design.md v1), the sample-mode imagery, the commit-eye mark and
the system fonts are locked; the open slot is the copy of every seed block
on `/` and `/testers`.

## Facts the candidates may use

Every sentence traces to `saari-co/RepoGlance` `main`: the README's
"Available on main" and "Not available yet" lists, `docs/store-listing.md`
(the Play copy for 0.4.0-beta.1) and
`proof/play-console-20260930/PROOF.md` (closed test on Google Play, testers
from the Google Group `repoglance-testers`, "Anyone on the web can join",
no opt-in link yet, API levels 31+, which is Android 12). No candidate
claims a CI column, a GitHub write, a Play opt-in URL, or calls a widget a
"stack". All five pass `tests/content.test.mjs` (9 of 9, including
EmDash's `validateSeed`) when copied over `seed/seed.json`; the shipped
seed was restored afterwards (`git checkout -- seed/seed.json`).

## The picker

Development-only sidecar under ignored `.grilltrack/work/copy-round-1/`
(never shipped), served with `python3 -m http.server 4355 --bind 127.0.0.1`
from that directory and opened at
`http://127.0.0.1:4355/?c=a&p=home&s=system`. Controls: pointer buttons for
candidate, page and scheme; keys 1-5 and the arrow keys (candidate), P
(page), S (scheme), H (collapse the bar to a corner tab); the bar wraps at
phone width and collapses out of the way. Labels are neutral; nothing is
marked recommended. `picker.json` validates with GrillTrack's
`validate_picker.py`.

The canvas is the production build of `174064e` (`npm run build`, served
by `npm run start` on local workerd with the seed fallback), saved as
`canvas/home.html` and `canvas/testers.html` with the built stylesheet
and the screenshots copied beside them. `engine.js` rewrites every
`section[data-block]` from a candidate's seed JSON the way the Astro
components render it (a mirror of `Hero`, `Feature`, `FactList`, `Steps`,
`Cta` and `TextSection`), so each candidate is a seed delta on the shared
canvas and the picked file can go into `seed/seed.json` verbatim.

**Fidelity check.** `?selftest=1` renders the shipped seed
(`canvas/shipped.json`, a copy of `seed/seed.json`) through the mirror and
compares the resulting `<main>` with the untouched canvas, whitespace
normalised. Result in Chrome: `home=identical testers=identical` (5658 and
3005 characters each), so the mirror and the real renderer agree for every
block type the candidates use. The forced light and dark toggle uses
`scheme.css`, generated from the built stylesheet's token blocks; the
captures use `s=system` with `prefers-color-scheme` emulation instead.

| File | SHA-256 |
| --- | --- |
| `index.html` | `783b45de8d4e24dcf5fa2359f37f3ba8677109160abd1c94192d1b7751e8a5e7` |
| `engine.js` | `a6544cbd91acd4ca8fd2046622c6ec68de47992f4d5a5925f6f84f74fe6ee0ea` |
| `scheme.css` | `7cbf4a8d0f071a7083f88972b0659aaf34b3f21998512f54b1a894ab790d8ee0` |
| `picker.json` | `fad5e35acb8d04dda02a61275284cf8fbdf1f0891e577cc3b0e7b597d8bf04be` |
| `build-candidates.mjs` | `7d770a7da86377549823d2151d2decee8abe0b99c559aab0501d3af486a241a1` |
| `build-scheme.mjs` | `bda4a9a13be950f7614e69c56b3f69bf0b8f89d48d0530cad436253d9fe2751a` |
| `canvas/home.html` | `9b22574c070c41a6f83b6ad77029fb15a31cf0fd256059188f9cb562fd9a4674` |
| `canvas/testers.html` | `e87613c14a5ba99d1b825408aed367cbc372cb65fc22adc46c47e5eb8ce1985f` |
| `canvas/shipped.json` | `0d3452718958842c4d42858e568ead1a0dd08df9bbff5b1dda3a6d1b67b35dcc` |
| `_astro/Site.BzY7eQ5M.css` | `b802c25d77487811c4df0dab6efe5b0ba674bd857b9361ff10c80d693d910221` |

## Candidates (seed deltas on the shared canvas)

Block structure, keys, links and screenshots are identical in all five
(hero, four feature cards, fact list, call to action on `/`; hero, three
steps, build list, feedback and privacy on `/testers`). Only the words
differ, in voice, structure, specificity and information order.

| Id | Label | Voice and order |
| --- | --- | --- |
| A | Plain | The foundation's voice and order, each block trimmed to the lengths the layout gives it: one hero lead, 300 px cards. "Your GitHub repos, at a glance, on your Pixel home screen." |
| B | Promise first | Second person, the benefit before the mechanism, short lines, fewer numbers. "Know what's open before you open GitHub." Facts: "Honest numbers, nothing else." |
| C | Facts first | Terse engineering register, names and numbers up front (version in the eyebrow, "about every 30 minutes" in the lead), the not-yet list in full (CI column, latest release, account-wide navigation). "Two widgets, one tile, zero GitHub writes." |
| D | Moments | The glance told as moments: on the home screen, in the app, in Quick Settings, before you sign in. "Glance at the home screen. Know where your repos stand." Facts: "What stays true all day." |
| E | Trust first | Formal register; privacy and read-only lead and the feature copy says what RepoGlance does not do. "Your repositories on the home screen. Nothing written back." Facts: "Privacy by construction." |

| Id | Delta file | SHA-256 |
| --- | --- | --- |
| A | `candidates/a.json` | `7bdf66eb42c110e83f2eb7e3c7cbce41a296e78465cd23542791a0f25bc1dc20` |
| B | `candidates/b.json` | `3d361fae302cde9898f6371f1b9b5974979713af37bc960056e051240550a10e` |
| C | `candidates/c.json` | `20f81179f2a76b920d34fea4fb942d61b52e33877af5efa98bf6e83bb41bbc14` |
| D | `candidates/d.json` | `c0d58424ae7972413e157d7ee3df7804e8869295009ad6c7767a0132c22e6789` |
| E | `candidates/e.json` | `f7c18feb31bc86088114d3cf4300a4f4af4e42d572db380aaf3d32d6646ff140` |

## Captures

Full-page renders through Google Chrome's DevTools protocol
(`scripts/capture.mjs` with `FULL_PAGE=1`, device metrics 375x812 and
1280x900, `prefers-color-scheme` emulation, picker chrome hidden with
`capture=1`), one run per candidate with both pages, renamed to
`<candidate>-<page>-<scheme>-<width>.png`. Files are in the private asset
release
[`repoglance-site-copy-round-1-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-copy-round-1-20261001)
of `saari-co/swarm-pr-assets` (40 assets).

| File | SHA-256 |
| --- | --- |
| `a-home-dark-1280.png` | `9070e85b80ba4b3774c5cd34ee3efb52a557ef1ccec76e1740540577caf7afe3` |
| `a-home-dark-375.png` | `bd548d3a5fa0e18aa848d7a1b98e5f81a6646734a42dd5cfe09fa7f8f6d12e58` |
| `a-home-light-1280.png` | `5f783135d3f9172d08aacc7e610474ce88351f409da93c26121c163694063e01` |
| `a-home-light-375.png` | `2367a82991861e9526d74e0ad0ca14d487845df20cb222b7ac3b9046ca6f04a5` |
| `a-testers-dark-1280.png` | `58a975886f061c784922fe4478f99e4442da4c67e6d0fdb8cf72c027fbb3ba61` |
| `a-testers-dark-375.png` | `9e7feef07e98581ddb8e497501ecd38ca048e3f8f370b96aaf8fc38c5b7a87f8` |
| `a-testers-light-1280.png` | `e5264ea63d1bb801d0d0b55ee4172f27d56446cdcf558133a362cb183d72aa4f` |
| `a-testers-light-375.png` | `748b1c725c50b5e5cbf18d5f1dee9906280b06e43e58fa64614cee9235de876d` |
| `b-home-dark-1280.png` | `80ab2a789c8cf4540280644222a7a65cb044b52472bf55df52294afa3507e135` |
| `b-home-dark-375.png` | `6e57b64f415c976766eeb3dfdea728afbcc1b8552671907f08b35c187df86e0e` |
| `b-home-light-1280.png` | `c8ca40a7ccde2c8d89e5c7421572df566e2c984c006d9f419812aaad8cafd229` |
| `b-home-light-375.png` | `948e26388f21ff0f12fd7180f1b6b3d95d51d38de5fc96da7b6a7444e7ff59fe` |
| `b-testers-dark-1280.png` | `c703257cbdc76f89681b8d091a549d85761215138ee65680f30b1d2d08ec6885` |
| `b-testers-dark-375.png` | `9fdbe441295f0c44955bf102938b02abed3dcfbc245ca52d7d2ef616bce2150e` |
| `b-testers-light-1280.png` | `92d4b4323869a64b1c753bdd9aad29d3c9f62a90c252958a10c99073bfe7af6f` |
| `b-testers-light-375.png` | `b099b8eba9ca7a875bf0c634d5820dea88453027b60491574752517ea43f0ace` |
| `c-home-dark-1280.png` | `8532b9908a0c6b320ecbd32de1cf05b096d14c3ac33eaf8ebb0b451cea2a3ccf` |
| `c-home-dark-375.png` | `abc3bb726ec5e1f8314e5e630379386a6dbd84cca8c7c16ed3884ab8e5f22fc9` |
| `c-home-light-1280.png` | `afde2470314ce3d9fbc04655fe9929d48bf62054c8ebe1344bc7a45c93983a00` |
| `c-home-light-375.png` | `4a469723ea8e635adc8bd0cfdf4b2f24f993ba265b96c006a384b76c59e95d19` |
| `c-testers-dark-1280.png` | `3c581cef58c0d43621f229183136321ede450253d0c9ec9f6e386f78b0ff1bb3` |
| `c-testers-dark-375.png` | `f9b003a57bbd131332c7aa585e8d8f870dd632f717045ef8188488b08f205b9f` |
| `c-testers-light-1280.png` | `ff3f58281232d50feab6594e1bacee83f0519f440ee03999efa0db3189b7ee45` |
| `c-testers-light-375.png` | `1c6cb49e918f9227a5dcb8d60fb55e06c0c212d68f10e0799e862e1ff82d925f` |
| `d-home-dark-1280.png` | `5fec81ba76ee3b9f542bd23b71d31c88427cd066ee23f9a8549376e9779ddd20` |
| `d-home-dark-375.png` | `fb79f8bb041cfae136dfea6f95de1d8b1d98f1d98b712813a5274ccb55dc27f6` |
| `d-home-light-1280.png` | `f336e1d6168dff4d850ea77631c558e55b6c3e49ff2cc9023aac10ee354b17f9` |
| `d-home-light-375.png` | `91083f5fc4842fda839e01b488694affbea98cc6bd7cc597ad1ab60cd6e48692` |
| `d-testers-dark-1280.png` | `3cc55dc757cfb6d30a1cbd65f44e3b437c81bdf9850297a87b182fd781ea809b` |
| `d-testers-dark-375.png` | `7bd4dd9ab4161704f408a816d5ff3ad3f33f7887e665117f789bd121ab8a005a` |
| `d-testers-light-1280.png` | `bf013f1366ff1b77062a5b048de9d1bd704fe3434c60808fb77b030b08544629` |
| `d-testers-light-375.png` | `81332cf089102527e852dbcab010621bbd400691e1863fe10cb3cd108ac35e25` |
| `e-home-dark-1280.png` | `7efcbb23a95582bcaff69f1ba99092fd8927a0dc42942dc05690f1774e6267b1` |
| `e-home-dark-375.png` | `45b7e497d221aee1a2a1c067f3e5ab12046c0eb70aa7910d080a9440fd926008` |
| `e-home-light-1280.png` | `d804b323b8dd588f366cd3b1d9a96e282b59170ffee436f6e0d0585ed90e8cbb` |
| `e-home-light-375.png` | `ee9616e89367e7b0ea19d4c8c146d4d6f40c9e1120b0c0a947bb65e006e3c7f6` |
| `e-testers-dark-1280.png` | `03dc5f40b23d68b9477821f73e0b6fdfadc40fa760a10eb786dcc6a14bf5c940` |
| `e-testers-dark-375.png` | `d2b949a7e6566ce8e707037f5bee66ae071924bdb5591a42b56c12eeeacc1765` |
| `e-testers-light-1280.png` | `46eae3b5faad59d9447cada253c7ae81cf17a9e442a1f9f5d3af0d937fd2698d` |
| `e-testers-light-375.png` | `88867aab6f84a32577a6c08e95c95a9b059aa236cca94d85d009eaca4fb2d9f6` |

## Inspection

Inspected directly: A, B, C, D and E on both pages, at 375 and 1280 px,
in the picker (Chromium, including the phone-width bar, keyboard
selection and the collapsed tab) and in the captures. Every candidate keeps
the locked composition: the band hero with the phone, the four-card slider,
the centred fact list, the band call to action, the join page's centred
column with the numbered steps, the mono build list and the closing band.
No horizontal overflow at 375 px; no truncation; the hero headings wrap to
two or three lines at both widths; the four cards stay level in the row
because the longest body sets the row height (C's and D's bodies are the
longest, at about 40 words).

Observations, not defects of the round:

- C, join page, 1280 px: the heading "Join the 0.4.0-beta.1 closed test."
  breaks the version at its hyphen ("0.4.0-" / "beta.1"). If that heading
  is picked, rephrase it or keep the version out of the heading at lock.
- A's hero lead is the longest (42 words, five lines at 1280 px); B's is
  the shortest band copy on the home page (page height 3079 px at 375 px
  against A's 3315 px).
- E's last fact folds the "not yet" line into the honesty item; the other
  four keep "Not yet: a CI column" as its own row.

## Fidelity limits

A capture of the production HTML with the copy applied client-side by a
mirror of the components, Chromium only, no CMS runtime, system fonts as
installed on this Mac. The self-test above shows the mirror matches the
real renderer for the shipped seed; the pick is written into
`seed/seed.json` afterwards and verified on the real build (`npm run
verify`, captures of `npm run build` served by `npm run start`) before the
decision is locked in the ledger.

## Outcome

Mixed pick with a precise hybrid request (maintainer, 2026-10-01): "For
home: I like D but I like the footer from A (Help test RepoGlance); for
join: also prefer D, except I prefer the middle content section from C",
quoting C's "Three steps, in order" block and its "In this build" list.
Every block is covered, so there is nothing left open for a second round
of five: the hybrid (home = D with A's call to action; join page = D with
C's steps and build list) is previewed alone as the replacement for the
five, for confirmation, in `copy-hybrid-1-captures-20261001.md`. Nothing is
locked or written into `seed/seed.json` by this round.
