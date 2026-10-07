# CMS drift: the live pages returned to the seed (2026-10-06)

Found while finishing the Open Graph deploy (`proof/og-image-deploy-20261006`):
the live pages were rendering the CMS entries, and those entries still
held the content from EmDash setup on 2026-10-01. None of the locked copy
(`site-copy-006`), imagery (`site-imagery-007`) or the seed's block-type
changes had ever reached repoglance.com. The maintainer chose to
unpublish both entries so the pages render from `seed/seed.json`, and to
decide the sync model in its own GrillTrack cycle (`cms-sync-011`,
queued).

## What was live before (curl, 2026-10-06, after the OG deploy)

| Page | `data-content-source` | Eyebrow and heading | Image slots |
| --- | --- | --- | --- |
| `/` | `cms` | "Read-only GitHub widgets for Google Pixels" / "Your GitHub repos, at a glance, on your Pixel home screen."; cards "Pin what matters", "Open issues and pull requests", "Widgets and a Quick Settings tile", "Try it without an account" | `home-widgets`, `catalog-pinned`, `repository-issues-and-prs`, `quick-settings-tile`, `connect-or-explore-sample` (phone frames, the foundation's slot assignments) |
| `/testers` | `cms` | "Closed testing on Google Play" / "Join the RepoGlance closed test."; "Three steps", "What this build does" | `connect-or-explore-sample` |

The Open Graph image and its tags were already correct: they come from
`src/layouts/Site.astro`, not from the CMS.

## Why

- EmDash setup (`cms-access-008`, 2026-10-01 13:30 UTC) copied the seed
  of the Worker deployed at that moment, built from the hosting branch:
  the foundation copy, the Play-listing image slugs and the block types
  with the old `screenshot` options. The copy lock had landed in the seed
  at 13:01 on `claude/site-copy`; the imagery lock followed at 16:34.
- `src/content/load-page.ts` renders the CMS entry whenever one exists
  and the seed otherwise; nothing re-seeds the CMS after setup, so later
  seed changes are invisible on the live site without any error.
- Every verification exercised the seed fallback: `scripts/smoke.mjs`
  runs on a fresh D1, the verify runs used fresh clones or this worktree,
  the captures came from local workerd. No check compared the live CMS
  render with the seed. The README's "the pages render from the CMS" was
  read as status, not as the divergence it was.

## What was done (maintainer's instruction, 2026-10-06)

From the maintainer's own signed-in EmDash admin tab (Cloudflare Access,
Google login), through EmDash's content API with the header
`X-EmDash-Request: 1` that its mutating routes require:

1. `POST /_emdash/api/content/pages/{id}/unpublish?locale=en` for `home`
   and `testers`: both 200, both entries now `draft`. EmDash purged the
   edge cache on the change.
2. The rewrite of the entries from the seed
   (`PUT /_emdash/api/content/pages/{id}` with `{ data }`) was prepared
   and tried: both PUTs answered 400, because the CMS's `hero` and
   `feature` block types still list the old `screenshot` options
   (`none`, `home-widgets`, `catalog-pinned`, `repository-issues-and-prs`,
   `repository-prs`, `owner-filter`, `connect-or-explore-sample`,
   `quick-settings-tile`) and reject the locked slugs. Updating the block
   types in place is possible through
   `PUT /_emdash/api/schema/block-types/{slug}` (select-option changes
   are compatible in EmDash 1.0.1's rules), but running that schema write
   from the maintainer's browser session was refused by the agent's
   permission layer, and the maintainer chose option 2 instead of doing
   it by hand: leave the CMS unpublished and make the sync model a
   decision.

Nothing else in the CMS was changed; the drafts keep the old data and the
block types keep the old options.

## Live after the unpublish (curl from this Mac, 2026-10-07 01:14 UTC)

| Page | `data-content-source` | Eyebrow and heading | Image slots | `og:description` |
| --- | --- | --- | --- | --- |
| `/` | `seed` | "Read-only GitHub widgets for Pixel" / "Glance at the home screen. Know where your repos stand." | `home-widgets`, `pinned-widget`, `catalog-rows`, `tile-row`, `signin-code` | the seed's |
| `/testers` | `seed` | "Closed testing on Google Play" / "Get the test build on your Pixel." | `signin-code` | the seed's |

Both answered with the edge policy and `cf-cache-status: HIT`;
`og:image:width` 1200 stayed in place.

## State and the decision ahead

- Live source: the seed, on both pages, until `cms-sync-011` decides how
  `seed/seed.json` and its block types reach the CMS (a sync script
  through the API with a non-browser Access identity, the CMS as source
  with the seed exported from it, or the seed alone) and adds a
  live-equals-seed check. `docs/cms-access.md` and `README.md` now say so.
- The CMS entries are drafts with the 1 October data; the `hero` and
  `feature` block types carry the 1 October `screenshot` options. Both
  must be brought up to date before anything is published from the CMS
  again, or the old copy returns.
- EmDash 1.0.1 API facts verified from `node_modules/emdash/dist` for the
  next cycle: mutating routes need `X-EmDash-Request: 1`; content
  `PUT` takes `ContentUpdateBody` (`data`, `_rev`, `overrideLock`, …) and
  writes the draft; `publish`/`unpublish` take `_rev`/`overrideLock`;
  block types take `expectedFingerprint` (the active version's
  `fingerprint`) and `fields`, with removed fields, type changes, new
  required fields and dark variants as the breaking cases that need a new
  version and `…/versions/{n}/activate`; the OpenAPI document is served
  at `/_emdash/api/openapi.json`.
