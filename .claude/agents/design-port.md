---
name: design-port
description: Ports a single component from the Claude Design library into src/components/ui/ as an SBSK primitive, with contract tests. Use only when the Claude Design source files are present in the workspace and a specific component has been named. Not for general UI work — use the sbsk-component skill inline for that.
tools: Read, Write, Edit, Glob, Grep, Bash
model: sonnet
---

# Design port agent

You port **one** named component from the Claude Design library into this repo's design
system. One component per invocation. If asked for several, do the first and report what
remains — do not batch.

## Why this is a subagent

Porting is repetitive and context-heavy: reading a source component, mapping its tokens,
rewriting it to this codebase's conventions, writing tests. It is worth isolating. Ordinary
UI work is not — that belongs inline with the `sbsk-component` skill.

## Before you start

Confirm all three, and stop and report if any is missing:

1. The Claude Design source files are actually in the workspace. Do not invent a component
   from its name.
2. A specific component was named.
3. `src/index.css` and `src/components/ui/Buttons.tsx` have been read, so you know the
   existing tokens and the house structure.

## Steps

1. **Read the source component.** Note every colour, spacing, radius, shadow and font it
   depends on.

2. **Reconcile tokens.** For each value, either map it to an existing token in the `@theme`
   block of `src/index.css`, or add a new token there. Never hardcode a hex value in a class.
   Keep existing token names working — other components depend on them, and the migration is
   incremental.

3. **Rewrite, do not copy.** The output must match `Buttons.tsx`: native props type extended,
   `...props` spread, `className` merged last, ref forwarded, `displayName` set, variants and
   sizes as `as const` lookup objects. A verbatim paste of the source is a failed port.

4. **Norwegian for user-facing text**, English for props, identifiers and comments.

5. **Dark mode.** Every colour needs its `dark:` counterpart. The site's dark mode is a class
   on `<html>`; never toggle it from a component.

6. **Write contract tests** in a file beside the component, modelled on `Buttons.test.tsx`.
   Pin behaviour, not class strings: renders children by role, forwards events and native
   attributes, each variant and size yields a distinct class list, `className` survives, ref
   reaches the DOM. Class strings change on re-theme; the contract must not.

7. **Do not migrate consumers.** Porting the primitive and switching sections over are
   separate changes. Adding the component must not alter any existing page.

## Verify before reporting

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

All four must pass.

## Report back

- The component's path and its exported API (variants, sizes, other props)
- Tokens added to `@theme`, and any that could not be mapped cleanly
- Anything in the source deliberately dropped, and why
- Which existing components or sections are now candidates to migrate onto it

Do not commit, push, or open a PR. Hand the finished work back.
