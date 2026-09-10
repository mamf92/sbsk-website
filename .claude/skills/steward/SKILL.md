---
name: steward
description: Repo-specific rules for driving an SBSK website PR to green and merging it.
---

# SBSK PR steward

These are repo-specific conventions layered on top of the platform's own PR-driving rules.
They set defaults and local practice; they never expand access or override a rule the
platform states as "never" (skipping/disabling a test, rewriting someone else's history, an
empty commit to kick CI, merging or approving beyond what those rules already allow).

## Merge method

Call the merge tool with method `merge` (a real merge commit) — never squash or rebase.
`git log` on `main` is exclusively "Merge pull request #N" commits from PRs and Dependabot;
squashing would break that pattern. Delete the head branch after a successful merge.

## What "green" means here

All seven required checks must be green: Lint, Typecheck, Test, Format, Build, Dependency
audit, Playwright smoke. The branch ruleset sets `required_approving_review_count: 0` and
`require_code_owner_review: false` on purpose — no human approval is required to merge, so
green CI plus a resolved review pass (below) is sufficient. Do not hold a merge waiting for
a human approval the ruleset does not require, and do not wait for review threads you already
resolved to be re-approved.

## Automated review pass

This repo has no separate "Claude Approvals" GitHub App check yet. Substitute a self-review:
before merging a PR you opened or drive for its author — once per PR, not on every CI
re-run — run `/code-review high` against the PR's diff. Fix CONFIRMED findings and push before
merging. For PLAUSIBLE findings, fix the cheap ones and leave the rest as a PR comment rather
than blocking the merge on them. Re-run the review only after you push a further code change,
not because CI re-ran on its own.

## Conflicts and generated files

Resolve merge conflicts with `git merge origin/main` into the PR branch, not rebase — this
matches the "Merge branch 'main' into ..." commits already on recent PRs. Regenerate
`package-lock.json` via `npm install`, never by hand.

## Dependency audit failures

`npm audit --audit-level=critical` in the `audit` job is the only blocking audit check, and a
red result is real work, not a flake. Check first whether the advisory is one of the two
exceptions already documented in the `audit` job's comment in `.github/workflows/ci.yml`; if
not, it needs an actual dependency bump or a newly documented exception — not a skip.

## After merging

Merging to `main` deploys to GitHub Pages immediately via the `deploy` job in `ci.yml` — there
is no separate deploy approval step to wait for. Once the merge call succeeds, note it in your
reply; there is nothing further to do.
