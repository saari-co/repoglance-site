# Access-gated CMS (2026-10-01)

Decision `cms-access-008`. The maintainer asked for the editor "the same way
as dinkuskit.com" and approved the plan on 2026-10-01: an Access application
mirroring the DinkusKit CMS one, the three Worker secrets set from this
machine without printing values, a build with the team domain, the first
login and EmDash setup by the maintainer.

## What was done

| Step | By | Result |
| --- | --- | --- |
| Zero Trust team | existing | the account's existing team (domain kept out of source) |
| Access application `RepoGlance CMS` | agent, in the maintainer's Chrome, read-only inspection of the DinkusKit app first | self-hosted; destinations `repoglance.com/_emdash` and `www.repoglance.com/_emdash`; the maintainer's existing reusable Allow policy (the one DinkusKit CMS uses); Google as the only identity provider with instant authentication; 24-hour session |
| `EMDASH_ENCRYPTION_KEY` | agent | generated with `npx emdash secrets generate --write .local/secrets.env` and piped into `wrangler secret put`; never printed |
| `EMDASH_OPERATOR_ALLOWLIST` | agent | the owner address the maintainer chose; piped, never committed |
| `CF_ACCESS_AUDIENCE` | agent | the application's audience tag, read from the `kid` parameter of the Access login redirect that the gated path returns; piped |
| `EMDASH_ACCESS_TEAM_DOMAIN` | agent | appended to the ignored `.local/deploy.env`; build input only |
| Build and deploy | agent | `npm run build` with the team domain, `prepare:deploy` with both custom domains, `wrangler deploy`; Worker version `d074759e-0e92-4db6-864f-d609af44a470` |
| First login and setup | maintainer | Google login through Access, EmDash setup with the seed content |

## Verification

Before the deploy, with the Access application active:

| Request | Result |
| --- | --- |
| anonymous `GET /_emdash/admin` on both hosts | 302 to the team's Access login |
| anonymous `GET /_emdash/api/setup` | 302 to the Access login |
| `GET /_emdash/admin` with a forged JWT header and cookie | 302 to the Access login |
| `GET /`, `GET /testers` | 200, unchanged |

After the deploy and the maintainer's setup:

| Request | Result |
| --- | --- |
| `GET /` and `GET /testers` on the apex and on www | 200 with `data-content-source="cms"`; the band hero, four feature cards, the band call to action, the closing band, the hero heading, the privacy link, the inline mark, the canonical, the Google Group link, the stated missing opt-in link, no Play URL, no script tag |
| anonymous `GET /_emdash/api/setup` | 302 to the Access login (setup is closed behind Access) |

Local resolver note: the maintainer's first attempt at the apex did not
load because this Mac's resolver still had the earlier negative answer
cached; the www host worked, and the apex resolved locally minutes later.

Full-page captures of the CMS-backed site (`scripts/capture.mjs`,
`FULL_PAGE=1`, 375x812 and 1280x900, `prefers-color-scheme` emulation), in
the private release
[`repoglance-site-live-cms-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-live-cms-20261001)
of `saari-co/swarm-pr-assets`. Six of the eight are byte-identical to the
seed-rendered captures in `proof/hosting-20261001/PROOF.md`, as expected
for the same content.

| File | SHA-256 |
| --- | --- |
| `index-dark-1280.png` | `35e7940fb8cfea416730b1b384a66d1d2f04a3a8555b721645f37ef8f5ec29b8` |
| `index-dark-375.png` | `87b72e52f267aee4fbb5fc6ed1a65f81a7ca8a887b785dc8de9c493913e36b4d` |
| `index-light-1280.png` | `2528dbfaf4b4ce66247ed823b228545f7f56cf01e3df87f80ee1d72692fdc53a` |
| `index-light-375.png` | `495263455bf613f2d7e716f58bc0d1996b8e888664f614b7f822578dc5be27d7` |
| `testers-dark-1280.png` | `58a975886f061c784922fe4478f99e4442da4c67e6d0fdb8cf72c027fbb3ba61` |
| `testers-dark-375.png` | `9e7feef07e98581ddb8e497501ecd38ca048e3f8f370b96aaf8fc38c5b7a87f8` |
| `testers-light-1280.png` | `e5264ea63d1bb801d0d0b55ee4172f27d56446cdcf558133a362cb183d72aa4f` |
| `testers-light-375.png` | `748b1c725c50b5e5cbf18d5f1dee9906280b06e43e58fa64614cee9235de876d` |

## Limits

- The audience tag was taken from the login redirect, not read from the
  dashboard's settings tab; the maintainer's successful login through to
  EmDash confirms it matched.
- A `wrangler tail` during the login window captured nothing usable; the
  evidence of the allow path is the maintainer's completed setup and the
  pages' switch to the CMS.
- The Worker-side guard's allow path is still only unit-tested in
  isolation; in production Access decides first at the edge.
- Nothing in this proof names the team domain, the policy's emails, the
  audience or any secret; `npm run audit:repo` enforces that.
