# Imagery hybrid preview captures (2026-10-01)

Decision `site-imagery-007`. Imagery round 1 ended with a pick and a
precise hybrid request (maintainer, 2026-10-01): candidate C (cut-outs),
with the "Before you sign in" card and the join-page hero showing the
sign-in screen "where it shows the click to copy code and open GitHub"
instead of the Connect screen. Per the frontend contract the hybrid is
previewed alone as the replacement for round 1's five, for confirmation.
Nothing is locked by this preview.

## The sign-in screen capture

RepoGlance's device-code screen shows a code GitHub issued for a live
sign-in, which `bin/verify-repoglance` refuses to dump or capture by
design. `saari-co/RepoGlance` therefore gained, on `claude/showcase-mode`
(commit `f19ca5b`), a debug-only `SignInCodePreviewActivity` that holds
the production screen open with the constant code `HK7N-4R2D`, dead
buttons and a fifteen-minute expiry, reached with `launch MIXED
signin-code`; it never asks GitHub for anything. The capture was taken on
the approved emulator's cover display (1080x2364, SystemUI demo clock
9:30, dark and light) with `phone_proof.py capture` (the lane's canonical
capture; the guard in the wrapper still refuses that screen on purpose).
Files `signin-code-dark.png`
(`3954cb4c329822dd7855da54428d8fe42aa3e2b95b23373cf01a314483fa6681`) and
`signin-code-light.png`
(`39dccaa44875f763f7d93c5c845d2aa141da50268261384a7a89b1be056ef07b`) in
the private release
[`repoglance-showcase-048-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-showcase-048-20261001).
The alt text says the code is made up.

## The hybrid

`candidates/h.json`: round-1 C with `home-sample` and `testers-hero` set to
`signin-code`; `candidates/h.css`: C's cut-out rules plus a centred crop
for the sign-in phone on the card. Built by `build-hybrid.mjs` from
round 1's files so every other slot is exactly C.

| Page | Slot | Image |
| --- | --- | --- |
| `/` | hero | home screen phone (both widgets) |
| `/` | On the home screen | Pinned repos widget cut-out |
| `/` | In the app | catalog rows cut-out |
| `/` | In Quick Settings | Quick Settings row cut-out with the tile |
| `/` | Before you sign in | sign-in code screen phone, centred crop |
| `/testers` | hero | sign-in code screen phone |

Served from ignored `.grilltrack/work/imagery-hybrid-1/` (the round-1
engine, canvas and assets, one candidate, no five-candidate manifest) on
`http://127.0.0.1:4355/?c=h&p=home&s=system`; the round-1 picker was
stopped.

| File | SHA-256 |
| --- | --- |
| `engine.js` | `288a6a55bdb8fb94f864d2e5af2552874b85934ab47913f823aacccb3db922a8` |
| `index.html` | `04d7b0dbafa1b6f6342123e91017ac272c4aa8c32f0e8658bd34b4a1efec048e` |
| `candidates/h.json` | `b67bcd9c1f082a30bdbc6f46208d40e2b724dde413f45282023246bb1c666693` |
| `candidates/h.css` | `090ddb3628d00925c6ac1904b8d9419490bb497b2da5b68be09bb920d4d4661f` |
| `candidates/h.config.json` | `b330a0565fab8bb4e085bf368dac079844264791653115d73d2f9ecfb9f33741` |
| `build-hybrid.mjs` | `f44b4dc55b27ec85bbb6836d54b29fc9709209353cac9bedf22433ef4adef76d` |
| `alt.json` | `ebaa9c65d2b3b993f7c3c58fabb19d83f3514f565a72692248e714bc43adc989` |

## Captures

Full-page renders as in round 1 (`scripts/capture.mjs`, `FULL_PAGE=1`,
375x812 and 1280x900, `prefers-color-scheme` emulation, picker chrome
hidden). Files are in the private asset release
[`repoglance-site-imagery-hybrid-1-20261001`](https://github.com/saari-co/swarm-pr-assets/releases/tag/repoglance-site-imagery-hybrid-1-20261001)
of `saari-co/swarm-pr-assets`.

| File | SHA-256 |
| --- | --- |
| `h-home-dark-1280.png` | `ea08937c5ac642f45eaacf11626c19897ce0fe22246311602520b031c41c5632` |
| `h-home-dark-375.png` | `d8dcae86ff22fc49ba869bc547d3456b9a7fc3beed7178a4b0cded8d9427d748` |
| `h-home-light-1280.png` | `7ae467a2e5829c81b74c6789e468f4267d54718792b432753e9b3b62002e113f` |
| `h-home-light-375.png` | `ccfcb8820de58d891cb140171b648b56a8f1a8387e52b8d7e3619f28dca3aa0c` |
| `h-testers-dark-1280.png` | `5b701b0c12ff8f0020f7cfeea4585e0ef74465572ef1aec3ddf02d6c849c4e59` |
| `h-testers-dark-375.png` | `a9c347d74c791f8ebae66f3f31eae9bfdd643fa76fa4490bbf00fffa64bbac3c` |
| `h-testers-light-1280.png` | `bae9e07f2b10c9a0d1f77beb753e7e67a3005dffff02991e5ed65b36436c876c` |
| `h-testers-light-375.png` | `def548d5c2b42601f44149f7a72adc0c09e303ff6287d8aa5afa0eb5e308cc44` |

Inspected directly on both pages, both widths, both schemes: C's cut-outs
as in round 1; the "Before you sign in" card shows the code, the expiry
line and the Copy code & open GitHub button; the join hero shows the same
screen as a 220 px phone. One thing to weigh: the card's copy (locked,
site-copy-006) describes Explore with sample data while its image now
shows the sign-in code screen.

## Outcome

Waiting for the maintainer's confirmation.
