# Copy hybrid preview captures (2026-10-01)

Decision `site-copy-006`. Copy round 1 ended with a mixed pick and a
precise hybrid request (maintainer, 2026-10-01): "For home: I like D but I
like the footer from A (Help test RepoGlance); for join: also prefer D,
except I prefer the middle content section from C", quoting C's "Three
steps, in order" block and its "In this build" list. Per the frontend
contract the hybrid is previewed alone as the replacement for round 1's
five, for confirmation. Nothing is locked by this preview.

## The hybrid

`candidates/h.json` (sha256
`1117cf9b3bb7c353cc12398a03bcb86f3f68ae235e519dcaf7951993bf6f5e28`),
composed block by block from the round-1 candidate files by
`build-hybrid.mjs` (sha256
`70b45072a267132ab40736b75b690b97f266622cdb08599bd6ff107911795a9e`), so
every sentence is one the maintainer saw in round 1:

| Page | Block (`_key`) | From |
| --- | --- | --- |
| `/` | `home-hero`, `home-pin`, `home-navigator`, `home-widgets`, `home-sample`, `home-facts`; page description | D (Moments) |
| `/` | `home-cta` ("Help test RepoGlance") | A (Plain) |
| `/testers` | `testers-hero`, `testers-feedback`, `testers-privacy`; page description | D (Moments) |
| `/testers` | `testers-steps` ("Three steps, in order"), `testers-build` ("In this build") | C (Facts first) |

It passes `tests/content.test.mjs` (9 of 9, EmDash `validateSeed`
included) when copied over `seed/seed.json`; the shipped seed was restored
afterwards.

## The picker

Development-only sidecar under ignored `.grilltrack/work/copy-hybrid-1/`:
the round-1 canvas (`canvas/home.html`
`9b22574c070c41a6f83b6ad77029fb15a31cf0fd256059188f9cb562fd9a4674`,
`canvas/testers.html`
`e87613c14a5ba99d1b825408aed367cbc372cb65fc22adc46c47e5eb8ce1985f`,
production build of `174064e`), `index.html`
(`783b45de8d4e24dcf5fa2359f37f3ba8677109160abd1c94192d1b7751e8a5e7`),
`scheme.css`
(`7cbf4a8d0f071a7083f88972b0659aaf34b3f21998512f54b1a894ab790d8ee0`) and
`engine.js` (`b0600ceb50b23cf78c5ab608e84a58d19fc2ba0ef7eccc12c330bea353fecb17`),
the round-1 engine with the candidate list read from
`candidates/labels.json` so the bar shows the one hybrid and no
five-candidate manifest is claimed. The round-1 picker was stopped; the
hybrid is served with `python3 -m http.server 4355 --bind 127.0.0.1` from
its directory at `http://127.0.0.1:4355/?c=h&p=home&s=system`.

## Captures

Full-page renders as in round 1 (`scripts/capture.mjs`, `FULL_PAGE=1`,
375x812 and 1280x900, `prefers-color-scheme` emulation, picker chrome
hidden), taken while the sidecar was served on port 4356. Files are in the
private asset release
[`repoglance-site-copy-hybrid-1-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-copy-hybrid-1-20261001)
of `saari-co/swarm-pr-assets`.

| File | SHA-256 |
| --- | --- |
| `h-home-dark-1280.png` | `204c439156b40719ec9e5bbcfa520f2074db65ed60e548db5566bfad5755b425` |
| `h-home-dark-375.png` | `a57d91301477795d07c6e454c9919eddb61d797a52f9a00f0ced6e0477801b58` |
| `h-home-light-1280.png` | `1f71ec89af6f77fb251ef797fbc155299035fb716a65a624da6ad48d5bb0d1aa` |
| `h-home-light-375.png` | `56e04887324bccd345c2f3b6dff1fe0a0ef2f9e341cc51e3052e0b77c56ea67a` |
| `h-testers-dark-1280.png` | `e4e5ff9814c0c6a4931bc8a4d6dfc23817841a1495d70657de6584c2add46cc8` |
| `h-testers-dark-375.png` | `5e46238fef89ba82384b02ca79bf33b03f1ce23a92f372401b708515c6b8316d` |
| `h-testers-light-1280.png` | `c0de9339cecd85769c429146d2b0c80ed3057bbd6b3a0a62b6d192b0416e2605` |
| `h-testers-light-375.png` | `115ba2a5512d21bec2bd41478380caffbe696dc3c4a9588cccf93aa905ecf96e` |

Inspected directly on both pages, both widths, both schemes: the home page
reads as round-1 D through the fact list and closes on A's "Help test
RepoGlance" band; the join page opens with D's "Get the test build on your
Pixel." hero, carries C's "Three steps, in order" and mono "In this build"
list, and closes with D's feedback and privacy. No overflow at 375 px, no
truncation; the seam between D's hero ("Bring the Google account you use on
Google Play") and C's step 1 ("with the Google account you use on Google
Play") repeats the account phrase once, which is the maintainer's pick as
given.

## Fidelity limits

As in round 1: the production HTML with the copy applied by the component
mirror (self-test identical for the shipped seed), Chromium only, no CMS
runtime. On confirmation the hybrid is written into `seed/seed.json` and
verified on the real build before the lock is recorded.

## Outcome

Waiting for the maintainer's confirmation.
