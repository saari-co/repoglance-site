# Deploy: the Open Graph image live (2026-10-06)

The maintainer merged PR saari-co/repoglance-site#5 (GrillTrack
`og-image-009`) on 2026-10-06 and answered "do 1" to the deploy. This
packet records the deploy and the live checks. No resource was created,
no secret touched, no DNS changed.

## Source

`main` at `21cc5e8c` (the merge of PR #5; its tree equals the PR head
`fdec6b1`, which CI verified: Site checks and Workflow validation green).
Staged in the agent's worktree checked out at that commit, Node 22.23.2
(`mise exec`), with the team domain from the ignored `.local/deploy.env`
as the build input (`docs/cms-access.md`, step 5):

```sh
set -a; . ./.local/deploy.env; set +a
npm run build
REPOGLANCE_CUSTOM_DOMAIN=repoglance.com,www.repoglance.com npm run prepare:deploy
npx wrangler deploy --config dist/server/wrangler.production.json
```

`prepare:deploy` summary: routes `repoglance.com` and
`www.repoglance.com` (custom domains), D1 `DB=repoglance-site-cms`, R2
`MEDIA=repoglance-site-media`, `worker_loaders` true, `cache.enabled`
true, `version_metadata` `CF_VERSION_METADATA`. The built client carried
`og-image.png` at 118269 bytes, SHA-256
`b607c73c7e31157dc157066e8db4d544958a005b950302e462ba8574912cced1`, the
committed file.

## Deploy

`wrangler deploy` exit 0 at about 21:38 UTC on 2026-10-06 (this Mac's
clock): 1 new asset uploaded (88 already uploaded), Worker startup 33 ms,
Worker version `46ee3581-4dc6-465f-9667-5830421d7e30`, custom domains
`repoglance.com` and `www.repoglance.com`, bindings `SESSION`, `DB`,
`MEDIA`, `IMAGES`, `ASSETS`, `CF_VERSION_METADATA`, `EMDASH_SITE_URL`,
`LOADER` (unchanged from the www deploy, `c07e777e`). The full log is in
the agent's ignored `runs/deploy-21cc5e8.log`.

## Live, right after the deploy (curl from this Mac, 21:39 UTC)

| Check | Result |
| --- | --- |
| `GET https://repoglance.com/og-image.png` | 200, `content-length` 118269, SHA-256 `b607c73c…cced1` (equal to the committed file), `cache-control: public, max-age=0, must-revalidate`, `cf-cache-status` MISS then REVALIDATED |
| `GET /` meta | `og:image https://repoglance.com/og-image.png`, `og:image:type image/png`, `og:image:width 1200`, `og:image:height 630`, `og:image:alt` with the made-up-data sentence; `data-content-source="cms"` (the D1 binding is the production database) |
| `GET /testers` with a Slackbot user agent | the same `og:image:width` and `og:image:height` (no bot-specific path exists) |
| anonymous `GET /_emdash/admin` | 302 to the Access login, as recorded in `proof/cms-access-20261001` and `proof/www-redirect-cache-20261001` |
| `GET https://www.repoglance.com/` | 301 to `https://repoglance.com/` |

## Not proven here

No real unfurl was triggered: Slack, Discord, X and iMessage fetch and
cache link cards on their own schedule, and their validators need a
signed-in account (a maintainer step; pasting the link in a fresh message
is the simplest check). The pages' `og:description` still comes from the
CMS entries, which carry the pre-copy-lock text; that is a CMS edit for
the maintainer (the seed text is in `seed/seed.json`), not a deploy.
