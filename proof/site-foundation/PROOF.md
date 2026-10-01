# Site foundation (2026-10-01)

Source commits: `ffe343e` (foundation) and `6e1dda3` (review round 1
fixes); later commits on the branch touch only `proof/` and `.grilltrack/`.

Branch `claude/site-foundation` in worktree
`~/Developer/side-quests/repoglance-site-foundation` of
`saari-co/repoglance-site`, off `main` at `f8d3f6c` (the initial commit:
`.gitignore` and `LICENSE`). GrillTrack: this repository's
`.grilltrack/ledger.json`, decisions `site-home-001`, `site-pages-002`,
`site-signup-link-003` (adopted from `saari-co/RepoGlance` `site-home-048`,
`site-pages-049`, `site-signup-link-050`, maintainer 2026-10-01) and
`site-foundation-004`.

**Source identity.** `source-manifest.json` lists every file in the slice
(tracked plus untracked-but-not-ignored; `proof/` and the GrillTrack state under `.grilltrack/` excluded) with its SHA-256;
the manifest's own digest at `6e1dda3` is `b0b8af176069518296a629e2c0e0e106cbe7bdd617e5899f64788b90d8b74022`. The commit SHA is recorded in
the pull request and in the ledger's review entry once the exact head is
reviewed.

## What was built

- Astro 7.3.5 + EmDash 1.0.1 on `@astrojs/cloudflare` 14.3.3 with
  `@emdash-cms/cloudflare` 1.0.1 (`d1`, `r2`, `sandbox`), Node 22.23.2
  (`.nvmrc`), Wrangler 4.144.0.
- `seed/seed.json`: six block types and the two pages. Every sentence
  traces to the RepoGlance README, `docs/store-listing.md` or the Play Console
  proof (`docs/content.md`).
- `src/components/ContentPage.astro`: the CMS entry when one exists, the
  seed otherwise; `<body data-content-source>` says which.
- `src/emdash-namespace-guard.ts` + `src/namespace-gate.ts`: production
  denies `/_emdash` unless Access is configured and verified
  (`docs/cms-access.md`).
- Sample-mode screenshots from
  `saari-co/swarm-pr-assets@repoglance-play-listing-20260930-040`, resized
  to 540 and 1080 px WebP (`docs/content.md` has the source hashes).
- Provisional styling only; `design.md` version 0 keeps the look unresolved.
- `npm run verify`, CI (`verify` + pinned actionlint), the ClawSweeper
  command stub, AGENTS/REPO_HYGIENE/README/docs.

## Verification

`npm run verify` on the final source (Node 22.23.2), exit 0:

| Step | Result |
| --- | --- |
| `audit:repo` | passed, 74 files, 53 scanned for forbidden paths and values |
| `types:wrangler` | `worker-configuration.d.ts` generated |
| `typecheck` (`astro check`) | 22 files, 0 errors, 0 warnings |
| `test:content` | 9 passed (seed validates with EmDash's `validateSeed`; two published pages; unique keys; hero and call to action; three steps with the Group link; every link site-relative or https; required links and no Play URL; honest-copy rules; every screenshot shipped and captioned, hero and feature lists equal) |
| `test:guard` | 9 passed (canonical paths; namespace detection; public and dev pass-through; denial without Access config whatever the headers; request-URL check; missing, invalid and empty identities; verified identity with and without allowlist; 404 shape) |
| `build` | Cloudflare build, `dist/server/wrangler.json` emitted |
| `test:smoke` | 64 checks on local workerd with a fresh D1 |

The smoke run proves, on the production entry with no CMS setup:
`/` and `/testers` answer 200 HTML from the seed with the hero heading,
the testers and privacy links, only sample-mode captures, no script tag,
the inline brand mark, canonicals without a trailing slash (`/testers/`
canonicalises to `/testers`), the Google Group link and the stated missing
opt-in link; eleven
`/_emdash` forms (bare, trailing slash, admin, setup, API, upper-case,
doubled slash, percent-encoded underscore, media file, content API) plus a
spoofed setup POST and a forged-JWT admin GET all answer 404 with no
redirect and no admin or setup HTML; `/nothing-here` renders the site's 404
page; `robots.txt`, `sitemap.txt`, both marks, a screenshot and the
Open Graph image serve with their content types.

**Development editor.** `astro dev` (port 4322, because another process held
4321): `/` and `/testers` 200 from the seed, `/_emdash/admin` 302 to
`/_emdash/admin/setup`, `/nothing` 404. The first guard version read
`Astro.locals.runtime.env`, which throws on Astro 6+; the catch branch then
denied the editor in development. The guard now reads `cloudflare:workers`
`env` and `process.env`, each read guarded, and leaves development
requests alone before any environment read.

## Captures

Re-taken after review round 1 (source `6e1dda3`) from the rebuilt production
output on local workerd through Google Chrome 154's DevTools protocol (`scripts/capture.mjs`: device metrics and
`prefers-color-scheme` emulation). Files live in the private asset release
[`repoglance-site-foundation-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-foundation-20261001).

| File | Size | SHA-256 |
| --- | --- | --- |
| `index-light-375.png` | 375×812 | `3c9b2b329ea1e4676d6f78196a0e02536e414d4bdb956d69dcc334d56d18127e` |
| `index-light-1280.png` | 1280×900 | `f721418d832942a1b6f76680e31c5ee3326059af70d7c813b0024254d0a45d32` |
| `index-dark-375.png` | 375×812 | `ad6ed36b9b42d3920be8d457fa9c367a0ab94c0e64f8c36bdbb8a125ba3cdce4` |
| `index-dark-1280.png` | 1280×900 | `174b67029253f40dfcf451a1cc8f8eec03fe0616279f959b1f1f4898e0b4dd8a` |
| `testers-light-375.png` | 375×812 | `7392d984447a7592d82b8ffe608f638c5cc00b0df37f4c198bd331c3f8bb925a` |
| `testers-light-1280.png` | 1280×900 | `18f678c1b2f0c35fd4882d94baaa1c6aefbc44bd598a43a18fae4f8994e4c332` |
| `testers-dark-375.png` | 375×812 | `51dc9b9e769d4a781169d62a6308ca1e7a7750e94e89201ce80965928d688c03` |
| `testers-dark-1280.png` | 1280×900 | `3b34f68f1805882ac3df21738b3ec5c6feb601aefa0e084e969c0396b0351819` |

Seen in the captures: the mono eyebrow, the hero with the home-widgets
sample capture, pill links, the four feature rows, the fact list, the call
to action and the footer disclaimer on `/`, with the brand mark visible in
both schemes; the hero, three steps with
the Group link, the build list, feedback and privacy sections on
`/testers`; no horizontal overflow at 375 px; both colour schemes.

## Not proven here

- Nothing is deployed. No Cloudflare Worker, D1, R2, DNS, custom domain or
  Access application exists for repoglance.com; hosted behaviour is not
  proven.
- The Access **allow** path is proven only by unit tests with an injected
  `authenticate`. Real Cloudflare Access verification needs the maintainer
  steps in `docs/cms-access.md`.
- The CMS-backed render path (`data-content-source="cms"`) was not
  exercised; the seed path is the shipped path.
- The look is provisional. No visual decision has been made.

## Review round 1

Exact-source review of head `ffe343ebf85daee2d4c2d6df02a165ade9ea2bea`
(the first commit of this branch) against the repository contract and the
confirmed decisions, ten angles, fifteen findings:

| # | Finding | Class | Resolution |
| --- | --- | --- | --- |
| 1 | Header mark loaded via `<img>`, so `currentColor` rendered black on the dark scheme | required_fix | mark inlined in `Site.astro`; smoke asserts it |
| 2 | Guard read the team domain at runtime while the runbook and `access()` use the build input | required_fix | team domain compiled into the guard from the build define; runbook corrected |
| 3 | CMS-editable hrefs rendered without a scheme check | required_fix | `safeHref` (site-relative or https, EmDash `isSafeHref`) in all link blocks; content test |
| 4 | `test.skip` misused inside a test body | required_fix | `t.skip`; `result.valid` asserted |
| 5 | `worker_loaders` needs Workers Paid, runbook silent | required_fix | runbook note with the free-plan path |
| 6 | Canonical kept the trailing slash | required_fix | pathname normalised; smoke asserts `/testers/` |
| 7 | Runbook omitted first-login-is-Admin | required_fix | runbook note (EmDash `isFirstUser ? ROLE_ADMIN`) |
| 8 | Dead `vite.define` of the team domain | required_fix | now consumed by the guard |
| 9 | String accessor duplicated in six components | required_fix | `src/content/blocks.ts` |
| 10 | Dynamic `import('node:fs/promises')` in the smoke | required_fix | static `mkdir` import |
| 11 | Feature screenshot options unchecked | required_fix | content test asserts hero and feature lists equal |
| 12 | Unused `seedSlugs` export | required_fix | removed |
| 13 | Capture left a Chrome profile dir | required_fix | removed in `finally` |
| 14 | `sizes` overstates feature image width (240 px cap) | defer | belongs to the look round; provisional CSS |
| 15 | Unreachable not-found branch in `ContentPage` | reject_false_positive | kept as the defensive fallback |

The fixes are commit `6e1dda367020821ced3879619c6e6fd19c691508`.
Re-verification on that source: `npm run verify` exit 0 (audit 74 files, 53
scanned; 0 type errors; 9 content and 9 guard tests; 64 smoke checks); the
dev editor still answers 302 to setup; captures re-taken (table above), the
mark visible in both schemes.

Re-review of `6e1dda367020821ced3879619c6e6fd19c691508` (the fix diff
against `ffe343e`: fifteen files, the guard, the block helpers, the layout,
the tests and scripts) found no further defects; recorded clean in the
ledger. Still unproven, as before: the Access allow path on a real Worker,
and that the build define reaches the guard in a build that sets the team
domain (the unit tests inject the environment).
