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
squashing would break that pattern. There is no branch-delete tool in the granted permission
set, so don't try to delete the head branch yourself after merging — rely on the repo's
"Automatically delete head branches" setting (Settings → General → Pull Requests) instead; ask
the maintainer to turn it on if stale `claude/*` branches are piling up.

## Wrapping up a PR

Whether it merges or closes, call `mcp__Claude_Code_Remote__unsubscribe_pr_activity` for it
once you're done — the subscription from opening the PR does not clean itself up, and a stale
watch on a closed PR is just noise.

## Issue bookkeeping

Issues are the backlog the next session plans from, so a PR is not finished until the issues it
touches say what actually shipped. Drift has happened here before: #230 fully delivered #82,
#168 and #169 but said "Addresses", and all three stayed open for weeks.

**Before starting work on an issue**, check it is still open and not already delivered —
search merged PRs for `#<n>`, and read the code the acceptance criteria name. If it is already
done, close it (`state_reason: completed`) with a comment naming the PR, commit or file/line
that delivered it, instead of redoing the work.

**Before merging**, read each linked issue's acceptance criteria against the diff, and tick the
boxes the PR satisfies by editing the issue body. Then decide per issue:

| What the PR delivers                        | In the PR body | On the issue                                                                                                                                                          |
| ------------------------------------------- | -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Every criterion                             | `Closes #<n>`  | Nothing more — the keyword closes it                                                                                                                                  |
| The core outcome, but some criteria are not | `Closes #<n>`  | Open a follow-up issue holding only the unmet criteria, linking back; attach it to the same parent epic if there is one; comment on the original naming the follow-up |
| Groundwork only — the outcome isn't there   | `Refs #<n>`    | Leave it open, with a comment saying what landed and what is left                                                                                                     |

Never write "Addresses", "Part of" or "Fixes part of" — they close nothing and say nothing
about what is left. Anything unrelated found mid-task gets its own new issue, listed under
**Follow-ups** in the PR body.

**After merging**, re-read every issue the PR names. Closing keywords only fire on PRs into
the repository's default branch, so any that are still open — a PR into a non-default branch,
or a keyword the parser missed — close them yourself with `state_reason: completed` and a
comment linking the PR. If the issue has a parent and that was its last open sub-issue, tick
the parent's checklist and close it too.

Every issue write carries evidence: a PR, commit or file/line. Do not close an issue on the
strength of a PR title alone.

## Security-sensitive changes need a human, not just self-review

The self-review pass below is you, the same agent, checking your own diff — it shares whatever
blind spot produced the diff, and CI does not exercise real Supabase RLS policies or auth
behavior. If a PR touches `src/supabase/`, an RLS policy, an auth guard/loader, or anything
under the member or board portal, do not self-merge on green CI alone: leave the PR for the
maintainer's explicit review, or at minimum flag the specific security-relevant lines in a PR
comment and wait for a human response before merging, even though the ruleset does not require
it.

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
is no separate deploy approval step to wait for. Once the merge call succeeds, run the
after-merge step of **Issue bookkeeping** above, then note the merge and any issues you closed
or opened in your reply.
