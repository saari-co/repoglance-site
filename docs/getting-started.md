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
it). Both pages render from `seed/seed.json` until a CMS entry exists. In development the EmDash editor is at
`/_emdash/admin`; its setup wizard creates a local admin with a passkey and
applies the seed. The local database and uploads live in ignored `.wrangler/`
and `.emdash/` directories.

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

`npm run cms:check` reports every difference between `seed/seed.json` and
the CMS, `npm run cms:sync` writes the seed into the CMS and publishes it,
and `npm run check:live` (after a build) compares the live pages with a seed
render. The runbook, the identity each needs and when to run them are in
[cms-access.md](cms-access.md#keeping-the-cms-equal-to-the-seed). Against
the local dev server pass `-- --url http://127.0.0.1:<port>`.

## Captures

```sh
node scripts/capture.mjs http://127.0.0.1:8787 runs/<packet> / /testers
```

Renders both pages at 375 and 1280 px, light and dark, through a local
Google Chrome's DevTools protocol. Output stays in ignored `runs/`; proof
links captures from external asset storage, never from Git.
