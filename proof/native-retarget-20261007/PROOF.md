# Native review retarget correction

Source base: `2999da8b151c3cd9a307f43a2c7674ea3db3b69a`.
Workflow Git blob: `b80258f0f0116a8f28f8f60a79f8c9e57f6bfa98`.

The caller accepts pull-request base edits, then applies the existing same-repository
and default-branch checks. Body-only edits stop before API reads and dispatch.

Validation on 2026-10-07: actionlint and git diff --check passed. Under Node
22.23.2, npm ci and npm run verify passed, including 124 local workerd smoke checks.
No product source or deployed configuration changed. The workflow bytes match the
qualified retarget template; live event proof is recorded in the operator's
review-infrastructure proof packet. This local validation does not substitute for
current-source CI and both required reviews before merge.
