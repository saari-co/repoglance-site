# Getting started

## Requirements

- Node 22.23.2 (`.nvmrc`; `mise` and `nvm` both read it)
- npm (ships with Node)

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

## Verify

```sh
npm run verify
```

See the README for what it covers. `npm run test:smoke` alone needs a build.

## Captures

```sh
node scripts/capture.mjs http://127.0.0.1:8787 runs/<packet> / /testers
```

Renders both pages at 375 and 1280 px, light and dark, through a local
Google Chrome's DevTools protocol. Output stays in ignored `runs/`; proof
links captures from external asset storage, never from Git.
