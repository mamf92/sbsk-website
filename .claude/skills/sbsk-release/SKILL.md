---
name: sbsk-release
description: Finish and ship a change on the SBSK site. Use when a piece of work is code-complete and needs verifying, committing, pushing and opening a pull request, or when checking CI on an existing PR. Covers the full verification gate, the branch and commit conventions, and the PR template.
---

# Shipping a change

Merging to `main` deploys to GitHub Pages. Never commit or push to `main` directly.

## 1. Run the full gate

All of these must pass before a PR is opened:

```bash
npm run lint        # eslint, must be clean
npm run typecheck   # tsc -b
npm run test        # vitest
npm run build       # tsc -b && vite build
```

Run the smoke suite too when the change touched routing, the app shell, the theme, or
anything affecting the bundle:

```bash
npm run test:e2e    # Playwright against a production build
```

If something fails, fix it. Do not open a PR describing a known-red gate as ready, and do not
narrow a test to make it pass — if an assertion is genuinely wrong, say so explicitly in the
PR body and explain why.

## 2. Branch

One branch per change, named for the work:

```
feature-<issue>-<slug>
chore-<issue>-<slug>
bug-<issue>-<slug>
```

Sessions driven by Claude Code use the `claude/<slug>` branch assigned to that session
instead.

## 3. Commit

Messages are English, in the imperative, with a `feat:` / `fix:` / `chore:` prefix matching
the repo's history. The body explains **why**, not a restatement of the diff.

Prettier runs through Husky and lint-staged on commit, so files may be reformatted as they
are staged. That is expected.

## 4. Push

```bash
git push -u origin <branch-name>
```

On a network failure, retry with backoff. A `403` is **not** a network failure — it means the
session's GitHub credentials are read-only, and retrying will not help. Report it and stop.

## 5. Pull request

Use `.github/pull_request_template.md`. It is short:

```markdown
# Pull Request

## Description and related issue

Closes #<issue-number>

What was changed and why?
```

Fill in the real issue number so the issue closes on merge. Write the "what and why" as prose
a reviewer can act on: what changed, why this approach, anything deliberately left out.

Open it as ready for review, not a draft. Do not merge it yourself — that decision is the
maintainer's, because merging deploys.

## 6. CI

`.github/workflows/ci.yml` runs lint, typecheck, tests and build, plus the Playwright suite as
a separate job. `.github/workflows/deploy.yml` runs on `main` only.

If CI fails on something that also fails on `main`, say so in the PR rather than trying to fix
an unrelated pre-existing failure inside this change.

## Scope discipline

One issue, one PR, one concern. Finding an unrelated bug mid-change is normal — **open an
issue for it, do not fix it here**. Mixed PRs are the main reason review stops being fast, and
fast review is what makes the autonomous loop work.

When a change is done, update `docs/ROADMAP.md` if it completes a tracked item.
