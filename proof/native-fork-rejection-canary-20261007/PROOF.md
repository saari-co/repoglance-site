# Native review fork rejection canary

Test-only fork-head PR; close unmerged after observing the workflow. No product or workflow code changes.

Base: `b40808e0a8472d1f975108cf239d5bd5b15509b3`. Workflow Git blob: `b80258f0f0116a8f28f8f60a79f8c9e57f6bfa98`.

Expected: the enabled pull_request_target workflow reads the live PR, rejects its foreign head repository, and skips request creation, artifact upload and private dispatch. This note records the test plan, not a passing result.
