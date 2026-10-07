# cms-first-013 slice 1: verification and review (2026-10-07)

Track `gt-20261007120417-1b0a54`. Full packet: `proof/cms-first-20261007/PROOF.md`.

## Lock

`cms-first-013` (maintainer, 2026-10-07, four amendments), superseding
`cms-sync-011`: the CMS owns content; the repository owns structure; the
site mirrors itself into the repository on publish and unpublish (no
schedule) through a GitHub token that never merges, with auto-merge from
the repository's own workflow and a failing truth test leaving the PR open
and red; every mirror failure emails the maintainer through Cloudflare
Email Routing; agents only write drafts, against the revision they read,
never publish, enforced in the gate; a brand-new site's first CMS load
comes from the seed, once. Slice 1 is the no-gate work; slice 2 the
maintainer's gates; slice 3 the agent draft lane.

Prior locks kept: the copy, imagery and scheme-imagery locks (the seed is
untouched and the CMS content equals it); `www-redirect-and-cache-009`;
`cms-access-008` (Access-only editor; the machine path admits only verified
Access JWTs, to fewer routes); `emdash-upgrade-012` (1.2.0).

## Implementation refs

- `src/content/cms-shape.ts`, `src/cms/mirror.ts`, `src/cms/mirror-trigger.ts`,
  `src/outer-middleware.ts`, `src/namespace-gate.ts`, `src/emdash-namespace-guard.ts`
- `scripts/cms-mirror.mjs`, `scripts/lib/cms-client.mjs`, `scripts/cms-sync.mjs`,
  `scripts/live-check.mjs`, `scripts/prepare-deploy.mjs`
- `.github/workflows/cms-edit-automerge.yml`, `wrangler.jsonc`,
  `worker-configuration.d.ts`, `package.json` (jose 6.2.12, scripts), `package-lock.json`
- `tests/cms-shape.test.mjs`, `tests/cms-mirror.test.mjs`, `tests/namespace-guard.test.mjs`
- `AGENTS.md`, `README.md`, `docs/cms-access.md`, `docs/content.md`, `docs/getting-started.md`

## Verification refs

- `npm run verify` on the final tree: figures below.
- Dev-server round trip with a GitHub stub (the packet's table): baseline
  equal; an admin-style publish fired the Worker mirror with the full
  GitHub sequence and the mirrored seed in the blob; the manual check and
  `--no-pr` write; a forced 401 produced the failure log and the email,
  written by Miniflare's `send_email` simulation.
- Unit tests: 13 CMS (shaping and the mirror with fakes), 13 guard
  (4 new for machine identities), 14 edge, 11 content.

## Verify figures

`npm run verify` on the final tree (Node 22.23.2 through mise): repository
audit 162 files, 103 scanned; Wrangler types; `astro check` 0 errors, 0
warnings; content 11/11; guard 13/13; edge 14/14; CMS 13/13; Cloudflare
build; smoke 124/124 on local workerd with the `send_email` binding.

## Review

Recorded below after the separate read-only review of the exact commit.
