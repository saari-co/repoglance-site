# Native review lifecycle verification fixture

This isolated documentation-only branch is an operator-authorized live fixture
for the shared Saari/Dinkus ClawSweeper intake rollout. It changes no site
content, application behavior, account, deployment, or credential.

The maintainer requested working end-to-end receipts for both bot identities.
This PR supplies the Saari source event and a later explicit review command.
The implementation lives in saari-co/spark-dgx; this fixture does not alter it.

Expected evidence, recorded by the infrastructure owner outside this branch:

- The automatic ready-PR request is admitted by the dedicated intake runner.
- Its queued receipt appears before model capacity is available.
- The same request reaches a started and terminal state without conflicting
  stale ownership.
- After that run is terminal, one supported human review command receives an
  eyes reaction and its own queued/started/terminal receipt.
- Published review and canonical readback agree on this exact source revision.

No result is claimed by this initial fixture. This PR is not a product change
and must not be merged as part of the live test. Keep its source revision fixed
until the evidence has been captured.
