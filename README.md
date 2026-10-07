# repoglance.com

The website for [RepoGlance](https://github.com/saari-co/RepoGlance), the
read-only, widget-first GitHub glance for Google Pixels. Two pages: the
overview at `/` and the closed-test signup at `/testers`.

Built with [Astro](https://astro.build) and [EmDash](https://emdashcms.com)
for Cloudflare Workers. Content starts from `seed/seed.json` and is edited
in EmDash behind Cloudflare Access (see below).

## Status

- **Source:** this repository, on `main`.
- **Live** at <https://repoglance.com> since 2026-10-01 on Cloudflare
  Workers with D1 and R2; the EmDash editor is behind Cloudflare Access.
  Since 2026-10-06 the pages render from `seed/seed.json`: the CMS entries
  from the 1 October setup predate the copy, imagery and block-type changes
  and are unpublished until a sync path is decided
  ([proof/cms-drift-20261006/](proof/cms-drift-20261006/PROOF.md)).
  `www.repoglance.com` redirects to the apex
  and the public pages are cached at the edge (purged on every publish). The
  gated steps and their proof are in [docs/cms-access.md](docs/cms-access.md),
  [proof/hosting-20261001/](proof/hosting-20261001/PROOF.md),
  [proof/cms-access-20261001/](proof/cms-access-20261001/PROOF.md) and
  [proof/www-redirect-cache-20261001/](proof/www-redirect-cache-20261001/PROOF.md).
- **Look:** decided in GrillTrack rounds on the real pages, each with
  exactly five candidates and, where the maintainer asked, a confirmed
  hybrid (the look in four rounds on 2026-10-01; the copy, the imagery,
  the link-preview image and, on 2026-10-06, the scheme-matched imagery
  in one round each); [design.md](design.md) is the contract (v5).
- **Copy:** decided on 2026-10-01 in one GrillTrack round and a confirmed
  hybrid; every sentence is in `seed/seed.json` and traces to
  [docs/content.md](docs/content.md).

## Run locally

Use Node from `.nvmrc` (22.23.2), then:

```sh
npm ci
npm run dev
```

Open the printed `127.0.0.1` URL. Both pages render from `seed/seed.json`.
The EmDash editor at `/_emdash/admin` is available in development only;
production builds deny that namespace unless Cloudflare Access is configured.

`npm run start` serves the production build on local workerd (`wrangler dev
--local`). It does not deploy.

## Verify

```sh
npm run verify
```

This runs the repository path audit, Wrangler type generation, Astro type
checking, the seed content checks, the namespace-guard, host and cache-policy
unit tests, a Cloudflare build, and an HTTP smoke test against local workerd:
both pages answer 200 with their seeded content and the edge-cache headers,
the `/_emdash` namespace answers 404 with no redirect and no caching, a
missing route answers 404, and the `www` host answers a permanent redirect to
the apex.

## Scope and decisions

- [Charter](docs/CHARTER.md)
- [Content sources](docs/content.md)
- [Getting started](docs/getting-started.md)
- [CMS access runbook](docs/cms-access.md)
- [Review policy](docs/review-policy.md)
- [Proof](proof/)
- Product decisions: `.grilltrack/ledger.json` (GrillTrack)

RepoGlance is an independent app by Saari. It is not affiliated with or
endorsed by GitHub, Inc. Google Play and Pixel are named only to say where the
app runs.

## License

[MIT](LICENSE)
