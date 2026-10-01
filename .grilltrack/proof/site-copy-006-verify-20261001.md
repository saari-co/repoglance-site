# site-copy-006 verification (2026-10-01)

The locked copy (design.md v2) implemented in the real site on branch
`claude/site-copy` (off `claude/site-foundation` at `174064e`) and
verified on the production build.

## Lock

Maintainer, 2026-10-01, "lock it", on the hybrid preview
(`copy-hybrid-1-captures-20261001.md`): the home page in copy round 1's
candidate D with A's call to action; the join page in D with C's steps and
build list. Dependencies: `site-look-005` (the layout the copy is judged
in) and `site-signup-link-003` (the Google Group link, the missing opt-in
link). Both stay represented: the captures below show the locked bands,
slider, fact list and join-page column, and the smoke run asserts the
Group link and the stated missing opt-in link.

## Implementation

Commit `dd526766bb6942c4a9de43f13b976296781e2708`:

- `seed/seed.json` (sha256
  `1117cf9b3bb7c353cc12398a03bcb86f3f68ae235e519dcaf7951993bf6f5e28`,
  byte-identical to `.grilltrack/work/copy-hybrid-1/candidates/h.json`):
  the words of every block on both pages; block types, keys, links and
  screenshot slugs unchanged.
- `scripts/smoke.mjs`: the hero-heading assertion now expects "Glance at
  the home screen. Know where your repos stand."
- `design.md` v2: the copy promoted into the verified foundations with the
  rules every edit keeps and the rejected directions; "Copy in the
  accepted layout" removed from the unresolved list; proof references.
- `docs/content.md`: the Play Console proof now cited for "Anyone on the
  web can join" and for "Android 12 or newer" (API levels 31+); the
  decision and the smoke coupling noted.
- `README.md`: a Copy status line.
- `.grilltrack/ledger.json`, `events.jsonl`: focus, lock and confirmation.

`tests/content.test.mjs` is unchanged: its rules protect facts that did
not change, and the new seed passes them.

## Verification

`npm run verify` on this source (Node 22.23.2), exit 0: audit 82 files (61
scanned), `astro check` 23 files with 0 errors, 0 warnings, 0 hints, 9
content tests (EmDash `validateSeed` included) and 9 guard tests, the
Cloudflare build, and 66 smoke checks on local workerd with a fresh D1,
including the new hero heading, the testers and privacy links, the Google
Group link, the stated missing opt-in link and no Play URL.

Full-page captures of `npm run build` served by `npm run start` (local
workerd, seed fallback, `data-content-source="seed"`) through Google
Chrome's DevTools protocol (`scripts/capture.mjs`, `FULL_PAGE=1`, 375x812
and 1280x900, `prefers-color-scheme` emulation). Files are in the private
asset release
[`repoglance-site-copy-006-verify-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-copy-006-verify-20261001)
of `saari-co/swarm-pr-assets`.

| File | SHA-256 |
| --- | --- |
| `index-dark-1280.png` | `204c439156b40719ec9e5bbcfa520f2074db65ed60e548db5566bfad5755b425` |
| `index-dark-375.png` | `a57d91301477795d07c6e454c9919eddb61d797a52f9a00f0ced6e0477801b58` |
| `index-light-1280.png` | `aff492f4f9cd521a6f494b86a010b792ca0f61f5ad43a4111f879d4e7af6bcc8` |
| `index-light-375.png` | `56e04887324bccd345c2f3b6dff1fe0a0ef2f9e341cc51e3052e0b77c56ea67a` |
| `testers-dark-1280.png` | `e4e5ff9814c0c6a4931bc8a4d6dfc23817841a1495d70657de6584c2add46cc8` |
| `testers-dark-375.png` | `5e46238fef89ba82384b02ca79bf33b03f1ce23a92f372401b708515c6b8316d` |
| `testers-light-1280.png` | `c0de9339cecd85769c429146d2b0c80ed3057bbd6b3a0a62b6d192b0416e2605` |
| `testers-light-375.png` | `115ba2a5512d21bec2bd41478380caffbe696dc3c4a9588cccf93aa905ecf96e` |

**Against the confirmed preview.** Seven of the eight files are
byte-identical to the hybrid preview captures in
`copy-hybrid-1-captures-20261001.md` (`index-dark-1280`, `index-dark-375`,
`index-light-375` and all four `testers-*` share their SHA-256 with
`h-home-dark-1280`, `h-home-dark-375`, `h-home-light-375` and
`h-testers-*`). `index-light-1280.png` differs from `h-home-light-1280.png`
in 30 pixels of 3,024,640, all in a two-pixel band at y 782 to 784 across
the slider row, by one channel level at most (measured with Pillow): an
anti-aliasing difference, not a content one. Inspected directly as well:
the same words, bands, slider, fact list and join-page column on both
pages, both widths, both schemes; no horizontal overflow at 375 px.

## Not proven here

As for the look: nothing is deployed; hosted behaviour, the Access allow
path and the CMS-backed render path are not exercised. The copy is
verified on the seed fallback, which is the shipped path until the CMS is
set up.

Re-verification on `8b2381e`: `npm run verify` exit 0 (audit 83 files, 62
scanned; 0 type errors; 9 content and 9 guard tests; Cloudflare build; 66
smoke checks). The fix changes no build input, so the production captures
above (taken from `dd52676`'s build) stand for this head. Re-review of
`8b2381e`: design.md's rule now matches the seed (four read-only
statements on the home page, none on the join page), docs/content.md's
claim and rule list match the seed and the test, nothing else changed;
no further defects; recorded clean in the ledger.
