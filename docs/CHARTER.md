# repoglance.com charter

## Accepted direction

repoglance.com is a small, honest website for the RepoGlance Android app:
what it is, what it does today, and how to join the closed test on Google
Play. It is built on EmDash with the Cloudflare adapter so the maintainer can
edit copy in a CMS later, and it ships with seeded content so the pages work
before any CMS exists. Content uses native upstream EmDash blocks (the
`blocks` field type and `Blocks` from `emdash/ui`); the DinkusKit blocks
package is being archived and is not a dependency (maintainer, 2026-10-01).

Decided on 2026-10-01 in the `saari-co/RepoGlance` GrillTrack ledger
(`site-home-048`, `site-pages-049`, `site-signup-link-050`) and adopted here:

- The site lives in its own public MIT repository, `saari-co/repoglance-site`.
- Two pages: `/` and `/testers`. The privacy policy stays at
  `https://saari-co.github.io/RepoGlance/privacy/`, where the Play listing
  points; this site links to it.
- The signup link today is the testers Google Group,
  `https://groups.google.com/g/repoglance-testers`. The Play opt-in link is
  added when Play Console shows it.

## What the site must not do

- Claim behaviour the app has not shipped and proven on `main`.
- Show a real account's data; every screenshot is sample mode.
- Collect anything: no forms, accounts, analytics or trackers.
- Act as a GitHub client, a dashboard or a chat surface.

## Hosting posture

Nothing is deployed from this repository until the maintainer creates the
Cloudflare resources and runs the deploy. Production builds deny `/_emdash`
unless Cloudflare Access is configured; the human bootstrap order is in
`cms-access.md`.
