# cms-sync-011 and emdash-upgrade-012: verification and review (2026-10-07)

Track `gt-20261007120417-1b0a54`. Full packet: `proof/cms-sync-20261007/PROOF.md`.

## Locks

- `cms-sync-011`: option D (maintainer, 2026-10-07). Seed is the only
  source; `scripts/cms-sync.mjs` keeps the CMS equal to it (block types,
  pages, publish, re-check); `scripts/live-check.mjs` proves the live
  pages equal a seed render; identity is the maintainer's own Access login
  cached by cloudflared; trigger is the deploy runbook; the comparison is
  modulo block `_version`; the service-token path is documented, not
  built.
- `emdash-upgrade-012`: EmDash 1.2.0 and `@emdash-cms/cloudflare` 1.2.0,
  pinned exactly (maintainer, 2026-10-07).

Prior locks kept: the copy, imagery and scheme-imagery locks are untouched
in the seed and the components; `www-redirect-and-cache-009`'s validator
behaviour was restored on 1.2.0 by passing the build time as the seed
render's last-modified (EmDash 1.1 stopped folding its build date into a
page without one); `cms-access-008`'s Access-only editor is unchanged.

## Implementation refs

- `scripts/cms-sync.mjs`, `scripts/live-check.mjs`, `scripts/lib/workerd.mjs`
- `scripts/smoke.mjs` (helper), `package.json` (pins, override, scripts),
  `package-lock.json`, `scripts/audit-repo.mjs`
- `astro.config.mjs`, `src/page-cache.ts`, `src/content/load-page.ts`,
  `tests/page-cache.test.mjs`
- `README.md`, `AGENTS.md`, `docs/cms-access.md`, `docs/content.md`,
  `docs/getting-started.md`

## Verification refs

- `npm run verify` on the final tree: audit, types, `astro check` 0/0,
  content 9/9, guard 11/11, edge 14/14, build, smoke 124/124.
- Live check against https://repoglance.com: both `<main>` equal, live
  source seed.
- Dev-server round trip (setup, reverse sync to the 1 October seed, drift
  reported, forward sync, equal, CMS render equal to the production seed
  render in `<main>`): the table in the packet.

## Review

Recorded below after the separate read-only review of the exact commit.
