# Rulesets

`main.json` is an export of the branch ruleset protecting `main`, kept here so the
protection config is reviewable in a diff rather than only visible in repo settings.

GitHub does not read this file. It is a record, not a source of truth — changing it
does nothing until someone re-imports it.

## Re-importing

Settings → Rules → Rulesets → New ruleset → Import a ruleset, or:

```bash
gh api -X POST repos/mamf92/sbsk-website/rulesets --input .github/rulesets/main.json
```

## Re-exporting after a settings change

Run this as a repository admin, or the bypass list will be missing from the result —
see below.

```bash
gh api repos/mamf92/sbsk-website/rulesets/20550543 \
  | jq 'del(.id, .node_id, .created_at, .updated_at, ._links, .source, .source_type, .current_user_can_bypass)' \
  > .github/rulesets/main.json
```

## Things that bite

- **`bypass_actors` is only returned to repository admins.** For any other token the
  API omits the key entirely — not an empty list, absent — and reports
  `current_user_can_bypass: "never"`, which describes the _token's_ own access rather
  than the ruleset's contents. An export taken without admin rights therefore loses the
  bypass list silently and looks identical to a ruleset that has none.

  `main.json` was exported that way, so it does **not** record the bypass list. The
  live ruleset does have one — repository admin, always allow. Read the UI (Bypass
  list) for the real state, and re-export with an admin token to capture it here.

- **Required contexts are job `name:` values from `ci.yml`.** Renaming a job there
  drops the corresponding required check here without any error — the ruleset keeps
  requiring a context that no longer gets reported, and PRs hang waiting for it.
- **The include pattern is bare `refs/heads/main`.** A quoted `refs/heads/"main"`
  matches nothing and silently protects nothing.
- `strict_required_status_checks_policy` means a PR must be up to date with `main`
  before merging. That friction is deliberate: merging deploys to Pages.
