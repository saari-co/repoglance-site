# repoglance.com

The website for [RepoGlance](https://github.com/saari-co/RepoGlance), the
read-only, widget-first GitHub glance for Google Pixels. Two pages: the
overview at `/` and the closed-test signup at `/testers`.

Built with [Astro](https://astro.build) and [EmDash](https://emdashcms.com)
for Cloudflare Workers. Content starts from `seed/seed.json` and is edited
in EmDash behind Cloudflare Access (see below).

## Status

- **Source:** this repository, on `main`.
- **Live** at <https://repoglance.com> (and `www`) since 2026-10-01 on
  Cloudflare Workers with D1 and R2; the EmDash editor is behind Cloudflare
  Access, and the pages render from the CMS. The gated steps and their proof
  are in [docs/cms-access.md](docs/cms-access.md),
  [proof/hosting-20261001/](proof/hosting-20261001/PROOF.md) and
  [proof/cms-access-20261001/](proof/cms-access-20261001/PROOF.md).
- **Look:** decided on 2026-10-01 in four GrillTrack rounds and a confirmed
  hybrid; [design.md](design.md) is the contract (v2 adds the copy).
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
checking, the seed content checks, the namespace-guard unit tests, a
Cloudflare build, and an HTTP smoke test against local workerd: both pages
answer 200 with their seeded content, the `/_emdash` namespace answers 404
with no redirect, and a missing route answers 404.

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
