# Review policy

Changes use independent checks: deterministic CI (`npm run verify` and a
pinned actionlint), the ClawSweeper command lane (`@clawsweeper review` on
its own line, from an org owner or member), and an agent-requested OpenClaw
review of the exact head. Reviews are evidence; only the maintainer merges,
after CI is green and a review is clean on the exact head.

The ClawSweeper command workflow is the public-repo stub from
`saari-co/RepoGlance`. Enrolment (the dispatch token, the App installation,
and the relay profile) is a maintainer step; until then the workflow posts
"not enrolled" on the PR. Never place review credentials in this repository.
