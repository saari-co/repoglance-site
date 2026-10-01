# Site foundation (2026-10-01)

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
the manifest's own digest is `16b80b64dd20bf3c5c365b3e8a6ebdc23c1efeb6cc75fe73835eeab203c63ae6`. The commit SHA is recorded in
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
| `audit:repo` | passed, 71 files, 50 scanned for forbidden paths and values |
| `types:wrangler` | `worker-configuration.d.ts` generated |
| `typecheck` (`astro check`) | 22 files, 0 errors, 0 warnings |
| `test:content` | 8 passed (seed validates with EmDash's `validateSeed`; two published pages; unique keys; hero and call to action; three steps with the Group link; required links and no Play URL; honest-copy rules; every screenshot shipped and captioned) |
| `test:guard` | 9 passed (canonical paths; namespace detection; public and dev pass-through; denial without Access config whatever the headers; request-URL check; missing, invalid and empty identities; verified identity with and without allowlist; 404 shape) |
| `build` | Cloudflare build, `dist/server/wrangler.json` emitted |
| `test:smoke` | 60 checks on local workerd with a fresh D1 |

The smoke run proves, on the production entry with no CMS setup:
`/` and `/testers` answer 200 HTML from the seed with the hero heading,
the testers and privacy links, only sample-mode captures, no script tag,
the Google Group link and the stated missing opt-in link; eleven
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

Rendered from the rebuilt production output on local workerd through Google
Chrome 154's DevTools protocol (`scripts/capture.mjs`: device metrics and
`prefers-color-scheme` emulation). Files live in the private asset release
[`repoglance-site-foundation-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-foundation-20261001).

| File | Size | SHA-256 |
| --- | --- | --- |
| `index-light-375.png` | 375×812 | `e4afdbaf9dcc176221fb378144281f1c5549b4e6ca7d47a26830578352164c04` |
| `index-light-1280.png` | 1280×900 | `93020211d4956256c6b62b7f331ba4e6d07cda84907b83bd8208af29434047ac` |
| `index-dark-375.png` | 375×812 | `49d559008f3ecd3d6c2ac0e2132cec7f236223dfca5f2666f6194bc2a5b5e5b8` |
| `index-dark-1280.png` | 1280×900 | `6ecfaf7df302b38475a7b07593c8b454fd62131a7bf4b407b07fd6b272be0a5b` |
| `testers-light-375.png` | 375×812 | `9fa5236e7caf56e2c5229ef24855ebb4b03065b88d12ed72024a124ff2b8a88a` |
| `testers-light-1280.png` | 1280×900 | `44a26f910d9e5b4ca91477d7d31d77038a50fb54136a8943838635d26c4aee3a` |
| `testers-dark-375.png` | 375×812 | `5d5798e817f5f03bb0b3ed8e73a6d4f4aced9893e5c6269c166eb765c578e308` |
| `testers-dark-1280.png` | 1280×900 | `7c7d20b049e8d7f443d0ef6d5b6eec60ed099eb37fedb475951a49463d6500d5` |

Seen in the captures: the mono eyebrow, the hero with the home-widgets
sample capture, pill links, the four feature rows, the fact list, the call
to action and the footer disclaimer on `/`; the hero, three steps with
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
