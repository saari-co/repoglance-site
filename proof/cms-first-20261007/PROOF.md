# CMS-first: the CMS owns content, the repository owns structure, the site mirrors itself (2026-10-07)

Decision `cms-first-013`, slice 1 (no gates), of the GrillTrack track
`gt-20261007120417-1b0a54`; it supersedes `cms-sync-011`. Branch
`claude/cms-authoring` from `main` at `1ba8ffb`; the exact commit reviewed
is named in `.grilltrack/proof/cms-first-013-verify-20261007.md`.

## What was decided

The maintainer reopened `cms-sync-011` the same day it shipped: an admin who
logs in to the editor to make a change expects it to persist, and people who
let agents build will want to log in and override. Option D had made the
admin the loser on the next sync. The replacement, with the maintainer's
four amendments:

1. The CMS owns content. A published admin edit is live and persists;
   after the one-time bootstrap by EmDash setup, nothing writes copy from
   `seed/seed.json` into the CMS.
2. The repository owns structure (block types, components, image slugs, the
   Worker), shipped by deploy and a schema-only `cms:sync`.
3. The site mirrors itself into the repository on publish and unpublish, with
   no schedule: the Worker builds the seed from the live CMS on top of
   `main`, pushes a `cms-edit/<timestamp>` branch and opens a PR titled
   "CMS edit: …" labelled `cms-edit` through a GitHub token that may push a
   branch and open or update a PR and never merges; a repository workflow
   arms auto-merge and GitHub merges when the checks are green; a published
   edit that fails a truth test leaves its PR open and red.
4. Any mirror failure emails the maintainer (Cloudflare Email Routing) with
   the page, the error and the `npm run cms:mirror` re-run. Never silent.
5. Agents only write drafts, never publish: a machine identity is admitted
   to reads and `_rev`-bearing draft writes only (the identity itself is a
   later slice).
6. Before writing a draft an agent reads the page's revision and writes
   against it; the gate refuses a draft write without `_rev`, EmDash refuses
   a stale one with 409.
7. A brand-new site's first CMS load comes from the seed, once.

Rejected on the way: E (admin wins but the repository follows through a
manual export and a conflict-aware sync; two writers of content), a
scheduled mirror (a clock for a site edited months apart), agents editing
the CMS directly (the truth rules exist to stop unproven claims).

EmDash 1.2.0 facts behind the shape (read in `node_modules/emdash/dist`):
no outbound webhooks, but host hooks on publish/unpublish and `waitUntil`
from `cloudflare:workers`; roles have no edit-any-without-publish tier and
API tokens belong to whoever creates them, so the draft-only rule lives in
the namespace gate; `PUT /_emdash/api/content/{collection}/{id}` accepts
`_rev` and answers 409 on a stale revision; live content sits in
`ec_<collection>` with one column per field; `wrangler dev` simulates a
`send_email` binding (`local-and-remote`) and writes the message to disk.

## What changed

| Area | Change |
| --- | --- |
| `src/content/cms-shape.ts` | Pure shaping shared by the Worker and the scripts: canonical page and field forms, `mirrorPages` (the seed with `content.pages` replaced by what is live, repository order kept, entry ids kept, blocks at version 1, a retired page kept as a draft), `pageDifferences`, `serializeSeed`. |
| `src/cms/mirror.ts` | The Worker-side mirror, pure: GitHub ref, contents, open PRs, blob, tree, commit, ref, PR, label through an injected `fetch`; updates the open `cms-edit` PR instead of opening a second, and closes it (deleting its branch) when live comes back to what `main` holds; never calls merge; runs only when the token, the repository var, the `send_email` binding and the recipient are all configured, otherwise logs what is missing and does nothing else; every failure becomes an outcome and an email with the page (slug and id), the action, the editor's display name, the error and the re-run; never throws. |
| `src/cms/mirror-trigger.ts`, `src/cms/trigger-helpers.ts`, `src/outer-middleware.ts` | Outer middleware after the guard: a successful publish, unpublish, restore, trash or permanent delete of a page, or the visual-editing toolbar's publish, schedules the mirror with `waitUntil` (inline when unavailable); the pure helpers read the live pages from D1 (`ec_pages`, the fields the repository declares, JSON parsed by declared type), the slug from the response, the editor's name from `locals.user`, and build the email as a plain-text RFC 5322 message with header injection folded out. |
| `src/namespace-gate.ts`, `src/emdash-namespace-guard.ts` | Machine identities: when the official Access authentication yields no email, the guard verifies the JWT itself with `jose` against the team's JWKS and audience; a JWT with `common_name` and no email is admitted only to GET on content and schema routes (not a collection's authors list), `POST …/preview-url`, `PUT` on an entry whose JSON body carries only `data`, `_rev`, `migrateBlocks`, `replaceBlocks` with a non-empty `_rev` (a status on a save is live metadata in EmDash and `status: "draft"` would unpublish the page, so it is never a machine key), and `POST` create carrying only `data`, `slug`, `status`, `locale` with `status: "draft"`; the body is refused above one megabyte, declared or actual; it must carry an EmDash Bearer token; publish, unpublish, schedule, discard, restore, delete, schema writes, lock overrides, live metadata and every admin route answer 404. `jose` 6.2.12 pinned as a direct dependency. |
| `scripts/cms-mirror.mjs`, `scripts/lib/cms-client.mjs` | `npm run cms:mirror` (writes the live pages into the seed on a throwaway worktree of `origin/main`, pushes `cms-edit/<timestamp>`, ensures the label, opens the PR with `gh`), `--no-pr` (rewrite the file here), `cms:mirror:check` (report, exit 1 when behind; schema drift reported with the fixing command). The identity ladder and the reads moved to the shared client module. |
| `scripts/cms-sync.mjs` | Schema only: block types create, update, breaking version and activation; pages reported, never written. |
| `scripts/live-check.mjs` | A difference now means the repository is behind the CMS (run the mirror or check the failure email); the live source is expected to be `cms`. |
| `.github/workflows/cms-edit-automerge.yml` | Arms auto-merge (merge commit) for `cms-edit` PRs on `cms-edit/*` branches from this repository with the repository token, only when the PR changes nothing but `seed/seed.json`, and disarms a PR that a later push widened; when GitHub refuses to arm a PR whose other checks already all passed, merges it directly; fails visibly otherwise (until the repository allows auto-merge). |
| `wrangler.jsonc`, `scripts/prepare-deploy.mjs`, `worker-configuration.d.ts` | The `send_email` binding `MIRROR_EMAIL`; vars `GITHUB_MIRROR_REPO` and `MIRROR_EMAIL_FROM`; the recipient from `REPOGLANCE_MIRROR_EMAIL_TO` at deploy time; the token as the secret `GITHUB_MIRROR_TOKEN`. |
| `tests/cms-shape.test.mjs`, `tests/cms-mirror.test.mjs`, `tests/cms-trigger.test.mjs`, `tests/namespace-guard.test.mjs`, `package.json` | CMS tests (shaping; the mirror with a fake GitHub: unconfigured for each missing piece, equal, closed, opened, updated, failed, an email that cannot be sent, a reader failure, descriptions; the trigger's route matching, slug extraction, D1 reader and email) and 6 new guard tests (machine admission, reads and preview, draft rules, the body allow-list, oversize and the operator list, the forbidden routes); `test:cms` in `verify`; scripts `cms:mirror`, `cms:mirror:check`. |
| `AGENTS.md`, `README.md`, `docs/cms-access.md`, `docs/content.md`, `docs/getting-started.md` | The CMS-first model, the section "Content, structure and the mirror" with the commands, the identity, the agent rule and the gates for the mirror; the setup step says the bootstrap is the only time the seed enters the CMS. |

## Verification (this Mac, Node 22.23.2 through mise)

`npm run verify` on the final tree (after review round 1): repository
audit (165 files, 106 scanned), Wrangler types, `astro check` (0 errors, 0
warnings), content 11/11, guard 15/15 (6 new for machine identities), edge
14/14, CMS 18/18 (shaping, the mirror, the trigger), the Cloudflare build,
smoke 124/124 on local workerd, which now carries the `send_email`
binding.

Round trip on the development server (`npm run dev`, EmDash 1.2.0, the
local D1 that held the seed's content, EmDash's development bypass as the
identity, an ignored `.dev.vars` pointing `GITHUB_API_BASE` at a local stub
of GitHub's REST API that records every call and answers like GitHub, with
a fake token and a fake recipient; stub and file removed afterwards):

| Step | Result |
| --- | --- |
| 1 | `cms:mirror:check`: live pages `testers, home`; "the repository equals the live CMS"; exit 0. |
| 2 | An admin-style edit through the same API the admin uses: `PUT` the home page with its `_rev` and a new hero heading, then `POST …/publish`. Live heading afterwards: "Glance at the home screen. Know where every repo stands." |
| 3 | The Worker mirror fired after the publish response: the stub recorded, in order and all with the Bearer header and the `repoglance-site-cms-mirror` user agent, `GET git/ref/heads/main`, `GET contents/seed/seed.json`, `GET pulls`, `GET git/commits/main000`, `POST git/blobs`, `POST git/trees`, `POST git/commits`, `POST git/refs`, `POST pulls`, `POST issues/101/labels`. The blob was the mirrored seed with the new heading and the entries' `id` keys. Dev log: `[cms-mirror] opened …/pull/101 (cms-edit/2026-10-07-203634z) with home`. |
| 4 | `cms:mirror:check`: "page home: content differs (layout[0].heading) … the repository is BEHIND the live CMS. Run npm run cms:mirror."; exit 1. |
| 5 | `cms:mirror --no-pr`: `seed/seed.json` rewritten, `git diff` one line (the heading); `cms:mirror:check` then equal; the file restored with git. |
| 6 | Forced failure: the stub set to answer 401 on the next blob write, then an admin-style edit of the testers description published. Dev log: `[cms-mirror] mirror failed after publish of pages/…: GitHub POST /repos/saari-co/repoglance-site/git/blobs answered 401: Bad credentials` and `[cms-mirror] failure email sent to the configured recipient`. Miniflare wrote the message to `.wrangler/tmp/email/…/*.eml`: `From: mirror@repoglance.com`, `To:` the fake recipient, `Subject: repoglance.com: CMS mirror failed for … (publish)`, the body with the page, "Action: publish by Dev Admin", the error line and the three-line re-run instruction. (The run named the page by its id; the slug is read from the publish response since.) |

Unit tests cover what the dev server cannot show: an open `cms-edit` PR
receives a new commit instead of a second PR; the token never issues a merge
call; a failure without a channel is logged as such; a machine identity's
admission and its forbidden routes.

## Limits

- Production is untouched. The Worker mirror and the email are dormant
  there until slice 2: the GitHub token secret, repository auto-merge, a
  ruleset on `main` requiring the site checks, Email Routing on
  repoglance.com with the recipient verified, the deploy-time recipient
  var, a deploy, one real edit and one forced failure.
- The machine-identity rules are in place but no machine identity exists
  yet (no Service Auth policy issues such a JWT); slice 3 adds the service
  token, a draft-scoped API token and the agent tooling.
- The dev round trip used EmDash's development bypass and a GitHub stub;
  `waitUntil` was exercised through the dev server's platform proxy, and
  the mirror's log lines appeared after the publish response. The run
  predates review round 1, so the trigger routes added there (restore,
  delete, the visual-editing publish), the close-when-equal path and the
  slug from the response are proven by unit tests, not by the dev run.
- A scheduled publish (cron) and a metadata-only save on a published page
  are not triggers; the first is mirrored at the next admin action or by
  `npm run cms:mirror`, the second changes nothing the pages render. Two
  publishes within seconds can race into two PRs or a non-fast-forward
  update, which the failure email reports; `npm run cms:mirror` resolves
  it.
- `cms:mirror` in PR mode uses `gh` and `git` on the maintainer's machine;
  it was exercised in `--check` and `--no-pr` modes here and its PR path is
  the same sequence the unit-tested Worker path performs through the API.

## Maintainer gates (slice 2)

In `docs/cms-access.md`, "Gates for the mirror": the token secret, the
repository settings, Email Routing and the recipient, the deploy, one real
edit and one forced failure.
