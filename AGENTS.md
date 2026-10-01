# Agent Contract

This public repository owns the repoglance.com website: a small Astro + EmDash
site on Cloudflare that introduces the RepoGlance Android app and links to its
closed test. Assume every committed byte is public.

## Source priority

1. This file.
2. `docs/CHARTER.md`.
3. `.grilltrack/ledger.json`, maintained only through the GrillTrack CLI.
4. Current source, tests, seed content and committed proof.

## Truth rules

- The site describes only behaviour that `saari-co/RepoGlance`'s `main`
  README lists as available and proven. No CI column, no GitHub writes, no
  Play opt-in link until Play Console shows one.
- Product copy lives in `seed/seed.json`; `tests/content.test.mjs` checks it
  for banned claims and required links. Change the copy and the test together.
- Imagery is sample mode only (the Play listing screenshots). Never a live
  account's data.
- The privacy policy stays at `https://saari-co.github.io/RepoGlance/privacy/`,
  where the Play listing points. This site links to it and serves no copy.
- The tester signup link is the maintainer's. Never guess a URL.

## Boundaries

- Native upstream EmDash blocks only: block types are declared in
  `seed/seed.json` and rendered with `Blocks` from `emdash/ui`. No
  `@dinkuskit/*` package may be added; the DinkusKit blocks package is being
  archived for proof purposes. `npm run audit:repo` enforces this.
- EmDash with the Cloudflare adapter (D1, R2, sandbox). Production builds deny
  the whole `/_emdash` namespace unless Cloudflare Access is configured and the
  request carries a valid Access identity (`docs/cms-access.md`). Public pages
  render from the CMS when an entry exists and from `seed/seed.json`
  otherwise; the seed fallback is the shipped path until the CMS is set up.
- No accounts, forms, analytics, third-party scripts or fonts. No Google or
  GitHub brand assets; their names appear in text only.
- No credentials, `.env`, `.dev.vars`, Wrangler secrets, Cloudflare account,
  zone, database or bucket identifiers, or Access team/audience values in
  source. Placeholders in `wrangler.jsonc` are local-only.

## Working rules

- Product decisions flow through GrillTrack before implementation. The look is
  decided in five-candidate rounds on the real pages; the picker lives under
  ignored `.grilltrack/work/` and never ships.
- Isolated worktrees and focused `claude/*` branches, one owner per worktree.
  The main checkout at `~/Developer/side-quests/repoglance-site` is not edited
  directly.
- `npm run verify` before every pull request. Visual claims need browser
  captures. Proof goes under `proof/<slice>/PROOF.md` with the exact source
  identity it describes.
- CI, ClawSweeper and OpenClaw reviews are evidence, not merge authority.

## Hard gates (maintainer only)

Merges; creating or changing any Cloudflare Worker, D1, R2, KV, DNS record,
route, custom domain or Access application for repoglance.com; `wrangler
deploy`; EmDash setup, editor accounts and secrets; anything that publishes;
license or visibility changes; deleting proof or decisions.
