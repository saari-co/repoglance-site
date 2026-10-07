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
- Unit tests after round 1: 18 CMS (shaping, the mirror with fakes, the
  trigger helpers), 15 guard (6 new for machine identities), 14 edge,
  11 content.

## Verify figures

`npm run verify` on the implementation commit (Node 22.23.2 through mise):
audit 162 files, 103 scanned; `astro check` 0/0; content 11/11; guard
13/13; edge 14/14; CMS 13/13; build; smoke 124/124. On the tree after the
round-1 fixes: audit 165 files, 106 scanned; `astro check` 0/0; content
11/11; guard 15/15; edge 14/14; CMS 18/18; build; smoke 124/124 on local
workerd with the `send_email` binding.

## Review round 1

Source identity: `git:b8b37900fa89726571bc51ebbe092aeda8fa416b` (the
implementation commit; parent `1ba8ffb`, main). A separate read-only agent
reviewed the diff and the full new files against AGENTS.md,
REPO_HYGIENE.md, EmDash 1.2.0's handlers in `node_modules/emdash/dist` and
the confirmed decision, ran the CMS and guard suites and actionlint.
ClawSweeper reviewed the same head on PR #13: no findings, no security
items, "ready for maintainer look", blocked only on the intentional merge
risks (the operational change, the slice-2 setup, slice 3's scoping).
Adjudication by the implementer:

| # | Finding | Classification | Resolution |
| --- | --- | --- | --- |
| 1 | `src/cms/mirror.ts`: the "equal" short-circuit ignored an open `cms-edit` PR, so an edit that was reverted or fixed in the admin left the stale PR armed to merge content the site no longer shows, and the docs' "the next publish updates this PR" was false in that case. | required_fix | When `main` equals live and a mirror PR is open, the PR is closed with a note and its branch deleted (`closed` outcome); unit test added; docs say so. |
| 2 | `scripts/cms-mirror.mjs`: `fail()` called `process.exit` inside `catch`, so `finally` never ran and a failed PR run leaked the temporary worktree and its entry in git's worktree list. | required_fix | The failure is recorded, `finally` removes the worktree (and prunes), then the script exits 1. |
| 3 | The confirmed text says the mirror is dormant when the token or the email channel is missing; the code mirrored without a channel and only logged failures, which made "never silent" false meanwhile. | required_fix | Aligned to the confirmation: the mirror runs only when the token, the repository var, the `send_email` binding and the recipient are all present; otherwise it logs what is missing and does nothing else. Tests cover each missing piece. (The reviewer proposed human_gate; the implementer chose the confirmed text, since it is the safer reading of the maintainer's amendment.) |
| 4 | Only the content publish/unpublish routes fired the mirror; EmDash also changes live content through the visual-editing toolbar's publish, restore, trash and permanent delete, scheduled publishes from the cron, and metadata saves. | required_fix for the request routes, defer for the rest | Trigger routes now: publish (both routes), unpublish, restore, trash and permanent delete; unit-tested. A scheduled publish and a metadata-only save are recorded limits in the runbook and the packet. |
| 5 | The machine PUT rule checked only `_rev` and `status`; EmDash writes `publishedAt`, `authorId`, `bylines`, `seo`, `taxonomies` live even on a published entry, and `overrideLock` steals a human's lock. | required_fix (reviewer: defer to slice 3; taken now, since it is the gate's rule) | Body allow-lists: PUT `data`, `_rev`, `status`, `migrateBlocks`, `replaceBlocks`; POST create `data`, `slug`, `status`, `locale`; anything else answers 404. Tests for each denied key. |
| 6 | The whole body was read before the size check. | required_fix (reviewer: defer; trivial) | `content-length` is checked first, then the text length; tests for declared and actual oversize. |
| 7 | `gh pr merge --auto` fails with "clean status" when the checks finished before the labelled run, leaving a green PR unmerged with a misleading error; nothing checked that the PR touched only the seed. | required_fix (reviewer: defer; taken) | The workflow arms only a PR whose diff is exactly `seed/seed.json`; on "clean status" it merges directly only when every check on the head has concluded successfully; otherwise it fails visibly. |
| 8 | `docs/cms-access.md` named the maintainer's mailbox in a public repository. | required_fix | Replaced by "the maintainer's mailbox"; the address stays in the deploy-time var. |
| 9 | The token has Contents write, so the ruleset must require pull requests on `main`, not only the status check. | human_gate | The gate list in the runbook now says so; the maintainer sets the ruleset in slice 2. |
| 10 | `decodeURIComponent` outside the catch; JSON parsed for any column starting with `{` or `[`. | required_fix (reviewer: defer; taken) | Decoding falls back to the raw id; columns are parsed by the declared field type; both in `trigger-helpers.ts` with tests. |
| 11 | Two publishes within seconds can race into two PRs or a non-fast-forward update. | defer | Recorded limit; the failure email reports it and `npm run cms:mirror` resolves it. |
| 12 | The editor's display name (EmDash derives it from the Access identity, falling back to the address's local part) appears in public PR titles and commit messages. | reject_false_positive | Within the decision (a name, never an address); noted for the maintainer. |
| 13 | `GET /_emdash/api/content/{collection}/authors` returns operator addresses and was within the machine read set. | required_fix (reviewer: defer; taken) | Denied for machines; tested. |
| 14 | No unit test covered the trigger (route regex, slug extraction, D1 reader), and the slug-from-response change was unproven by the dev run. | required_fix (reviewer: defer; taken) | The trigger's pure parts moved to `src/cms/trigger-helpers.ts` with `tests/cms-trigger.test.mjs`. |

Checked and found clean by the reviewer: no credentials, identifiers or
Access values in source (placeholders kept; recipient and token at deploy
time; `jose` 6.2.12 direct); the token only ever in the Authorization
header, logs and emails carrying slug, id, action, editor name and the
error only; no code path calling a merge endpoint; the GitHub sequence
(ref, contents at that sha, open PRs, commit tree, blob, tree, commit,
ref, PR, label after creation); the workflow's labelled trigger, same-repo
guard and minimal permissions, actionlint clean; jose verifying issuer and
audience with the JWKS cached per team, the verifier only running when the
official path yields no email, a JWT carrying an email never admitted as a
machine, the human path byte-for-byte the previous logic; machine route
matching denying encoded, doubled-slash, cased, `%2E%2E`, PATCH and DELETE
variants and every publish, schedule, delete, schema and admin route; the
D1 reader's validated and quoted identifiers and the fact that drafts live
in revisions so a pending agent draft cannot leak into the mirror;
`waitUntil` with the inline fallback; the publish response shape; the
schema-only sync; the manual mirror never writing to the CMS, its
`--check`/`--no-pr`/PR semantics and exit codes, `execFile` without a
shell; REPO_HYGIENE; the proof naming the branch, base and ledger file.
Source intent: the decision implemented with nothing material beyond it;
short of it on findings 1, 3 and 4, all resolved above.

Ledger: `cms-first-013` reviewed with findings (required_fix, defer,
reject_false_positive, human_gate) at `git:b8b37900…`, returned to
implementation; round 2 below.
