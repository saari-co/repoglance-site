# Repository hygiene

Root markdown stays at the front door: `README.md`, `AGENTS.md`,
`REPO_HYGIENE.md`, `design.md` and `LICENSE`. Depth goes to `docs/`, checks to
`scripts/` and `tests/`, curated proof to `proof/<slice>/` and
`.grilltrack/proof/`.

The GrillTrack CLI owns `.grilltrack/ledger.json` and its append-only events.
Working candidates and the live picker stay in ignored `.grilltrack/work/`.
Local worktrees live beside the main checkout as
`~/Developer/side-quests/repoglance-site-<slug>`; `worktrees/` and `runs/` are
ignored here.

Never commit local databases, `.local/`, `.wrangler/`, build output,
dependencies, `.env`, `.dev.vars`, credentials, account or zone identifiers,
or Access values. `npm run audit:repo` checks the tracked paths and runs in
`npm run verify`.

Screenshots in `public/screenshots/` are cuts of RepoGlance's showcase
captures (made-up repositories under fictional owners, a fixture sign-in
code) and nothing else; `docs/content.md` records their source release,
hashes and crops.
