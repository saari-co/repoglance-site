# Deploy: scheme-matched imagery live (2026-10-07)

The maintainer merged PRs saari-co/repoglance-site#7 (GrillTrack
`site-scheme-imagery-010`, the track closed in its ledger) and #6 (the
Open Graph deploy and CMS drift proof) on 2026-10-06 and said "deploy
main" on 2026-10-07. This packet records the deploy and the live checks.
No resource was created, no secret touched, no DNS changed.

## Source

`main` at `e4e7be1` (the merge of PR #8, which adds only a disabled
workflow file and a proof note on top of `88fc0a8`, the merge of PR #6,
on top of `8bac655`, the merge of PR #7; CI green on `e4e7be1`). Staged
in the agent's worktree checked out at that commit, Node 22.23.2
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
the 24 light cuts (`home-widgets-light-540.webp` SHA-256
`0092e73d…d8748`, equal to the committed file) and the unchanged
`og-image.png` (`b607c73c…cced1`).

## Deploy

`wrangler deploy` exit 0 between 11:56:12 and 11:56:28 UTC on
2026-10-07: 24 new assets uploaded (89 already uploaded), Worker startup
27 ms, Worker version `52fbc0a8-a3c0-44ab-b556-ad3e92af0bb7`, custom
domains `repoglance.com` and `www.repoglance.com`, bindings `SESSION`,
`DB`, `MEDIA`, `IMAGES`, `ASSETS`, `CF_VERSION_METADATA`,
`EMDASH_SITE_URL`, `LOADER` (unchanged from the OG deploy, `46ee3581`).
The full log is in the agent's ignored `runs/deploy-e4e7be1.log`.

## Live (curl and captures from this Mac)

| Check | Result |
| --- | --- |
| `GET /` at 11:56:44 UTC, 16 s after the deploy | 200, `cf-cache-status: MISS`, but the previous version's markup (no `<picture>`, 8484 bytes): the colo answering had not yet received the new version, and the edge cached that answer under the page's five-minute policy (`www-redirect-and-cache-009`). `HIT` with the same old markup at 11:57:17 and 12:01:37, `UPDATING` at 12:01:57, then the new markup from 12:02:17 (`HIT`, 9630 bytes). No purge was made; the entry expired on its own. |
| `GET /` from 12:02:17 UTC | 200, `data-content-source="seed"`, five `<picture>` elements with one `(prefers-color-scheme: dark)` source each: the hero `data-scheme="band"` (dark `home-widgets` image, light source), the four cards `data-scheme="page"` (light image, dark source), exactly as `scripts/smoke.mjs` asserts on the build |
| `GET /testers` at 11:56:44 UTC and after | 200, the new markup from the first fetch: one `<picture>`, `data-scheme="page"`, light `signin-code` image with the dark source |
| the light assets (`home-widgets-light-{540,1080}`, `pinned-widget-light-540`, `catalog-rows-light-540`, `tile-row-light-540`, `signin-code-light-{540,1080}`) and `home-widgets-540` | 200 `image/webp`, each byte-equal to the committed file |
| `GET /og-image.png` | SHA-256 `b607c73c…cced1`, unchanged |
| `GET https://www.repoglance.com/testers` | 301 to `https://repoglance.com/testers` |
| anonymous `GET /_emdash/admin` | 302 to the Cloudflare Access login, as before |

**Captures.** `scripts/capture.mjs` against `https://repoglance.com`
(`FULL_PAGE=1`, 375x812 and 1280x900, `prefers-color-scheme` emulated),
taken after the home page refreshed: all eight files are byte-identical
to the verification captures of `site-scheme-imagery-010`
(`.grilltrack/proof/site-scheme-imagery-010-verify-20261006.md`, release
`repoglance-site-scheme-imagery-010-verify-20261006` of
`saari-co/swarm-pr-assets`), which are in turn identical to the hybrid
the maintainer confirmed. The live site renders the lock pixel for pixel
in both schemes at both widths. (A first capture run at 11:57 UTC caught
the stale home page: its four home files differed, its four join files
were already identical.)

| File | SHA-256 |
| --- | --- |
| `live-home-dark-1280.png` | `05e45ca937af21682b42c6066b4adee2007ec38d75756fdd4c12102dfdbfe4bd` |
| `live-home-dark-375.png` | `4ec53bcca7f60c9fbd1d581a646d90969a12fcd9c04c59eabdd57ee58467f645` |
| `live-home-light-1280.png` | `4312736f0a99eeefd4920d6f8dc4b0420b1ff32e1d136b8a44c6b664654eea06` |
| `live-home-light-375.png` | `f1804e4907b3bf41ab159cfad9e3796e7d23e686e49e78f85a8c603fc3866794` |
| `live-testers-dark-1280.png` | `5b701b0c12ff8f0020f7cfeea4585e0ef74465572ef1aec3ddf02d6c849c4e59` |
| `live-testers-dark-375.png` | `a9c347d74c791f8ebae66f3f31eae9bfdd643fa76fa4490bbf00fffa64bbac3c` |
| `live-testers-light-1280.png` | `771b392929348439fd31d92eee32a727009b3c56f6b4d114369d64463db3b083` |
| `live-testers-light-375.png` | `1d1d860157c13ba57e106aca5e097569a7110b6236c67ae6e441ca54db949846` |

## Worth knowing

A deploy does not purge the edge cache, and a request that lands before
the new version has reached every colo can cache the old page for up to
five minutes plus the one-minute stale window. Harmless here, but a
deploy-time purge by the `pages` cache tag (a maintainer action with the
zone's API token) would close the window; the EmDash publish path already
purges by tag.

## Not proven here

The pages render from the seed because the CMS entries stay unpublished
(`proof/cms-drift-20261006`); a future CMS sync must carry the new
`screenshot` options or the pictures will not follow. Chromium only, as
in every round.
