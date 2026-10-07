# Native ready-PR caller preparation

Base: `88fc0a8803039265aeaa5c16e632526c3b6bba3b`. Workflow SHA-256: `89430fe931d6137c9df6dbb05a2d4e1a2f4d121e8facfbfba6c12252a6259edc`.

The caller remains disabled while `CLAWSWEEPER_SPARK_ENABLED` is absent. It accepts open, non-draft, same-repository PRs on the current default branch, preserving existing commands and deployment workflows.

Workflow actionlint and diff checks pass. Repository closeout checks, native and comprehensive OpenClaw reviews, receiver qualification and live-event canary proof remain pending. No product or production change.
