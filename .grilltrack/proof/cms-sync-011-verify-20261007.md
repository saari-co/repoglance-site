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

## Review round 1

Source identity: `git:0890336b5343f136019d9dd387934dc95497cc96` (the
implementation commit; parent `e4e7be1`, main). A separate read-only agent
reviewed the diff and the full new files against AGENTS.md,
REPO_HYGIENE.md, EmDash 1.2.0's handlers in `node_modules/emdash/dist` and
the confirmed summary. Adjudication by the implementer:

| # | Finding | Classification | Resolution |
| --- | --- | --- | --- |
| 1 | `scripts/live-check.mjs`: `--help` called `readHelp()` before the `const`s it reads existed, so `node scripts/live-check.mjs --help` threw `ReferenceError: Cannot access 'paths' before initialization` (exit 1). The real run was unaffected. | required_fix | Fixed in the next commit: the defaults are computed first and the help text is printed inline; `--help` exits 0 for both scripts. |
| 2 | The review section of this note was a placeholder, so the proof did not yet name the exact source identity. | required_fix | This section; both decisions' ledger reviews carry the commit SHA. |
| 3 | `cms-sync.mjs` picks the first inactive version whose fields are canonically equal to the seed's after a breaking `PUT`; EmDash's own reuse test compares exact JSON, so two canonically equal inactive versions would resolve to the older one. | defer | Harmless: the re-check is canonical too and rendering ignores `_version`; noted for a later hygiene round. |
| 4 | `--header` values are visible in `ps` while the script runs, as with EmDash's own CLI. | defer | `EMDASH_HEADERS` is the documented alternative; the maintainer path uses neither. |
| 5 | Suspected `liveData` to be an MCP-only shape. | reject_false_positive | The REST route hydrates the draft for a reader with `content:read_drafts` (`data` = draft, `liveData` = live) and strips both otherwise, so the draft check is right for the maintainer and inert for others. |
| 6 | Suspected a CMS render could wrongly lose or gain a validator with the build-time fallback. | reject_false_positive | A CMS render keeps the entry date; Astro keeps the later of two dates so EmDash's build date still folds in; the fallback fires only when the entry has no `updated_at`; a seed render after an unpublish gets a different ETag (build time), so no conditional request can keep a retired body; in dev the value is the dev-server start time, acceptable without an edge cache. |
| 7 | Suspected the `@codemirror/language` override to be unjustified. | reject_false_positive | All six nested copies resolve to 6.12.4, the lock has no 6.13 or streamparser entry, the override is one exact package documented with its removal condition. |

Checked and found clean by the reviewer: the EmDash API usage
(fingerprints, `BLOCK_TYPE_BREAKING_CHANGE`, version reuse and activation,
`migrateBlocks` and `_version` rules, `_rev` on update and publish, the
list without a status filter, the CSRF header and Bearer handling of the
client), secrets (labels only, cloudflared's output never echoed, no
identifiers added), exit codes, the `<main>` extraction and refetch, the
workerd helper's shutdown and temp-dir cleanup, the smoke refactor
touching only start and stop with all 47 `record` sites intact, the
standards (one AGENTS.md line, seed untouched, proof layout, package
scripts, `verify` unchanged) and the source intent (every element of
option D; the `--json`, `--seed` and `--override-lock` options and the
CMS-render fallback as bounded additions; no guard change; no delivery or
Cloudflare action).

Ledger: `emdash-upgrade-012` reviewed clean at that commit (findings 6 and
7 concern it and were rejected); `cms-sync-011` reviewed with findings
(required_fix, defer, reject_false_positive), returned to implementation
for finding 1.
