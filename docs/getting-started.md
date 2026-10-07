# Getting started

## Requirements

- Node 22.23.2 (`.nvmrc`; `mise` and `nvm` both read it)
- npm (ships with Node)
- For the CMS sync and check against repoglance.com: `cloudflared`
  (Homebrew `cloudflared`), used only to cache your own Access login

`package.json` pins `@codemirror/language` to 6.12.4 through `overrides`:
6.13.0 (published 2026-10-07) imports `@codemirror/streamparser` without
declaring it and breaks `astro build` through EmDash's admin bundle. Drop
the override once an upstream release declares the dependency.

## Develop

```sh
npm ci
npm run dev
```

Astro 7 runs the dev server as a background process and prints its address;
it takes `127.0.0.1:4321` or the next free port (`npx astro dev stop` ends
it). Both pages render from `seed/seed.json` until a CMS entry exists, their
images from the repository's captures under `public/screenshots/`; a CMS
page renders its Media Library files instead, both through the image
endpoint (`/_image`). In development the EmDash editor is at
`/_emdash/admin`; its setup wizard creates a local admin with a passkey and
applies the seed, downloading the captures the seed names from the
repository's `main` on GitHub (a `$media` reference cannot point at the dev
server itself: EmDash refuses loopback hosts). The local database and
uploads live in ignored `.wrangler/` directories.

## Production build on local workerd

```sh
npm run build
npm run start
```

`start` runs `wrangler dev --local` on `127.0.0.1:8787` with the production
worker entry. `/_emdash` answers 404 there, as in production without Access.
The public pages carry the edge-cache headers (local workerd does not emulate
the edge cache itself), and a request with `Host: www.repoglance.com` answers
the 301 to the apex.

## Verify

```sh
npm run verify
```

See the README for what it covers. `npm run test:smoke` alone needs a build.

## The CMS and the live site

The CMS owns content and the repository owns structure
([cms-access.md](cms-access.md#content-structure-and-the-mirror)).
`npm run cms:mirror` writes the live CMS pages into `seed/seed.json` and
opens the `cms-edit` PR (`npm run cms:mirror:check` only reports);
`npm run cms:check` and `npm run cms:sync` compare and write the block
types; `npm run cms:media` and `npm run cms:media -- --apply` compare and
import the approved captures into the Media Library and connect the pages'
image slots; `npm run check:live` (after a build) compares the live pages
with a seed render. Against the local dev server pass
`-- --url http://127.0.0.1:<port>`. The mirror the site runs itself after a
publish can be exercised locally by pointing `GITHUB_API_BASE` in an
ignored `.dev.vars` at a stub.

## Captures

```sh
node scripts/capture.mjs http://127.0.0.1:8787 runs/<packet> / /testers
```

Renders both pages at 375 and 1280 px, light and dark, through a local
Google Chrome's DevTools protocol. Output stays in ignored `runs/`; proof
links captures from external asset storage, never from Git.
