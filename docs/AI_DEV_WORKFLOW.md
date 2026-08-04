# AI development workflow

How work moves through this repo now that most of it is done by agents.

## Why issues still matter

Agent sessions are **ephemeral**. The container is a fresh clone that gets reclaimed after
inactivity, and conversation context does not survive it. Nothing an agent "remembers"
carries to the next session.

So the durable state has to live somewhere the next session can read:

| What                         | Where             | Why there                                          |
| ---------------------------- | ----------------- | -------------------------------------------------- |
| Standing conventions         | `CLAUDE.md`       | Loaded into every session automatically            |
| What to build next           | GitHub issues     | Survives sessions; you can write them from a phone |
| Why the code looks like this | PR descriptions   | Attached to the diff forever                       |
| Whether it works             | CI on the PR      | Machine-checked, not vibes                         |
| Longer-term direction        | `docs/ROADMAP.md` | One file, reviewed occasionally                    |

Dropping issues would not save effort — it would move the backlog into chat logs that get
discarded. Keep them. They are the handoff protocol, not bureaucracy.

## The loop

1. **You (PO)** open an issue describing the outcome. Use the templates in
   `.github/ISSUE_TEMPLATE/`. Focus on intent and acceptance criteria, not implementation.
2. **Agent** picks it up: branches, implements, runs the full gate, opens a PR that says
   `Closes #<n>`.
3. **CI** runs lint, typecheck, unit tests, build and the Playwright smoke suite.
4. **You** review the PR — mostly product judgement, since CI covers correctness.
5. **Merge to `main`** deploys to GitHub Pages automatically.

You stay in steps 1, 4 and 5. Steps 2 and 3 should need nothing from you.

## Writing a good issue for an agent

An agent reads the issue and the repo, not your intent. What helps:

- **The outcome**, in user terms. "Members can see which events they signed up for."
- **Acceptance criteria** as checkboxes. These become the PR's definition of done.
- **Norwegian copy**, if you already know the wording you want.
- **Constraints** worth stating: which page, which existing component to reuse,
  what must not change.

What is not needed: file paths, component names, or an implementation sketch. Those are in
`CLAUDE.md` and the code. Over-specifying wastes your time and boxes in a better solution.

Small and specific beats large and vague. "Redesign the member portal" produces a sprawling
PR you cannot review; three scoped issues produce three you can.

## Verification gate

Every change must pass, locally and in CI:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e   # when routing, the shell or the theme changed
```

An agent that cannot get these green should open a draft PR explaining why, not merge past
it or silently narrow the work.

## Scope discipline

One issue, one PR, one concern. If an agent finds an unrelated bug mid-task, the rule is:
open an issue for it, do not fix it in the current PR. Mixed PRs are the main reason review
stops being quick — and quick review is what makes an autonomous loop actually work.

## Token discipline

Cost tracks context read, not lines written.

- `CLAUDE.md` is in every request. Keep it accurate and short; prune it when it drifts.
- Prefer skills (loaded on demand) over subagents (each spawn re-derives context cold).
- Never grep or read `package-lock.json` — it is 629 KB.
- Large files are a recurring tax. `CalendarSection.tsx` is ~550 lines; splitting files that
  get edited often pays for itself quickly.
- Point at issue numbers and file paths instead of pasting code into chat.
