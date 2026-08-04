# Roadmap — AI dev space transition

Living document. Update as phases complete; keep it short.

## Phase 0 — Unblock access (owner: Martin)

Environment settings, not repo changes. Everything below is blocked until these land.

- [x] **GitHub App write access** — granted. Push, issue and PR creation all work.
- [ ] **Network allowlist** on the Claude environment:
      `*.api.sanity.io`, `cdn.sanity.io`, `*.apicdn.sanity.io`,
      `<project-ref>.supabase.co`, `api.supabase.com`, `mamf92.github.io`
- [ ] **Environment variables**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
      (both already public in the deployed bundle — no new exposure)
- [ ] **`SANITY_API_TOKEN`** — an _Editor_ token from manage.sanity.io → API → Tokens.
      Not Administrator. Tokens are available on the free plan; fine-grained custom roles
      are the paid feature, which is why the coarse Editor role is the right pick.
- [ ] **`SUPABASE_ACCESS_TOKEN` + `SUPABASE_PROJECT_REF`** — the MCP server is pinned to
      `--read-only` in `.mcp.json`; drop that flag only if we decide agents should migrate.
- [ ] **Claude Design handoff** — "Send to Claude Code Web" on the SBSK library project.
      `DesignSync` cannot authenticate in web sessions, so this is the working path.

Verify afterwards by asking an agent to read a Sanity document and describe the members
table. Both failing means the allowlist did not apply.

## Phase 1 — Agent scaffolding ✅

- [x] `CLAUDE.md` — corrected conventions (the old copilot instructions were badly stale)
- [x] `.github/copilot-instructions.md` reduced to a pointer, so the two cannot drift
- [x] `.claude/settings.json` — permission allowlist, deny direct pushes to `main`
- [x] `.claude/hooks/session-start.sh` — installs deps so no session wastes a turn
- [x] `.mcp.json` — Sanity + Supabase MCP servers (inert until Phase 0)

## Phase 2 — Verification loop ✅

- [x] Vitest + Testing Library — 30 unit tests
- [x] Playwright smoke suite — 6 tests against a real production build
- [x] `.github/workflows/ci.yml` — lint, typecheck, test, build, e2e on every PR
- [x] Typecheck extended to config and e2e files, which were unchecked
- [x] Fixes: undeclared `uuid`, eager Studio bundle, dead `tailwind.config.js`,
      `supbaseKey` typo, `w-5fill-current` broken class

## Phase 3 — Skills ✅

Deliberately small. Skills load on demand; agents re-derive context on every spawn.

- [x] `sbsk-component` — add or change UI against the design system
- [x] `sbsk-sanity-schema` — schema type + query helper + loader, kept in sync
- [x] `sbsk-supabase-query` — the RLS-aware query-helper pattern
- [x] `sbsk-release` — verify, PR against the template, watch CI
- [x] One `design-port` agent for the mechanical Claude Design conversion — that work is
      genuinely parallel and repetitive. Nothing else warrants a subagent.

## Phase 4 — Claude Design library (component-by-component)

Agreed approach: port each component as a feature needs it, not in one sweep. Keeps diffs
reviewable and avoids a large speculative migration.

- [ ] **Token reconciliation first.** Today's `@theme` is 7 colours + 2 fonts with no
      spacing, radius or shadow scale. Map Claude Design tokens in, keep the existing names
      as aliases so nothing breaks at once.
- [ ] **Inventory** — Claude Design components vs. `src/components/ui/` (currently just
      `Button`) vs. what is inlined in sections. Decide port / adapt / skip per component.
- [ ] **`Button` first** — it has real usage and its test suite already pins the contract,
      so it validates the token mapping.
- [ ] **Migrate consumers smallest-first** — `LoginSection` and `RegisterSection` (~95 lines)
      before `CalendarSection` (~550).
- [ ] **Retire aliases**, delete dead styles.
- [ ] Optional: Figma Code Connect. Figma MCP is already connected with a full seat and is
      the one design channel here with no restrictions.

The repo stays the source of truth. Claude Design is upstream.

## Known issues found during setup

Logged rather than fixed, to keep the setup PR scoped. All four are open on GitHub:

- #74 — 12 pages render a nested `<main>` inside the shell's `<main id="main">`
- #75 — `useMemberSearch` has a no-op `useEffect` setting loading true then immediately false
- #76 — Sanity schema types use implicitly-typed `rule` parameters
- #77 — the 404 page is an unstyled placeholder with debug colours and no `<h1>` (see also #63)
