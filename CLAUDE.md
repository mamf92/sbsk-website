# SBSK website — agent guide

Vite + React 19 + TypeScript SPA for Stavanger Brettspillklubb. Deployed to GitHub Pages
from `main` via `.github/workflows/deploy.yml`. Content comes from Sanity; auth and member
data from Supabase.

## Verify before you finish

```bash
npm run lint       # eslint, must be clean
npm run test       # vitest unit tests
npm run build      # tsc -b && vite build, must pass
```

`npm run test:e2e` runs the Playwright smoke suite against a production build. Run it when
you touch routing, the app shell, or the theme.

## Language

Norwegian-first. UI copy, labels and route slugs are Norwegian, including non-ASCII paths
(`/våre-spill`, `/våre-partnere`). Keep the router in `src/main.tsx` and every link that
targets a route byte-identical. Code identifiers, comments and commit messages are English.

## Layout

- `src/main.tsx` — `createBrowserRouter`, all routes, `basename` from `VITE_BASE`.
- `src/App.tsx` — shell: skip link, `Header`, `<Outlet />`, `Footer`, wrapped in `ThemeProvider`.
- `src/pages/*` — one default-exported component per route.
- `src/components/layout/*` — Header, Footer.
- `src/components/sections/*` — page-level composed sections.
- `src/components/ui/*` — reusable primitives. **This is the design system.** New shared UI goes here.
- `src/loaders/*` — React Router loaders. `src/sanity/queryHelpers/*` and
  `src/supabase/queryHelpers/*` hold the actual fetching.

Adding a route means touching `src/main.tsx`, a page in `src/pages/`, and usually a loader.

## Styling — Tailwind v4

There is no `tailwind.config.js`, and adding one will not do what you expect. Theme tokens
live in the `@theme` block of `src/index.css`: colours (`bg-darkblue`, `text-orange`,
`--color-placeholder`), the `xs` breakpoint, and `font-heading` / `font-body`.

Add a new token to `@theme` rather than hardcoding a hex value in a class.

Motion tokens live there too (`--duration-base`, `--transition-snappy`, `--shadow-1`/`-2`,
`--lift-hover`, `--lift-press`). Do not assemble them by hand — apply the `lift` utility,
which owns the brand's hover/press micro-interaction. An element takes `lift` _instead of_
`transition-colors`/`transition`, never both. See `docs/DESIGN_LANGUAGE.md`.

Dark mode is class-based via a custom variant: `@custom-variant dark (&:where(.dark, .dark *))`.
The `dark` class goes on `<html>`; `src/utils/theme.ts` owns reading, applying and persisting it.
Style dark states with `dark:` and never toggle the class outside `theme.ts`.

## Components

Use `Button` from `src/components/ui/Buttons.tsx` rather than a raw `<button>`. It takes
`variant` (`primary` | `secondary` | `tertiary` | `toggle` | `disabled`), `size`
(`xs` | `sm` | `md` | `lg`) and `icon` — pass an existing icon key (`'right'`, `'moon'`, …)
instead of adding a new prop or an inline `<svg>`. To add an icon, drop the SVG in
`src/assets/icons/` and extend the icon map.

## SVGs

Imported as React components through SVGR with a `?react` suffix:
`import Arrow from '../../assets/icons/arrows/arrowright.svg?react'`. The module declaration
lives in `src/vite-env.d.ts`.

## Environment

Only `VITE_*` variables reach the client via `import.meta.env` — never put a secret in one.
`VITE_BASE` is `/` locally and `/sbsk-website/` on Pages; it feeds both Vite's `base` and the
router `basename`. Supabase reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
The Sanity project is `85tc4tb0`, dataset `production`, configured in `src/sanity/client.ts`.

There is no committed `.env` of any kind — only `.env.example`. `.env` and every `.env.<mode>`
file are gitignored, because Vite loads them identically and a `VITE_` variable in one is
published in the bundle.

GitHub Pages cannot set response headers, so the Content-Security-Policy is a `<meta>` element
injected into `index.html` by a plugin in `vite.config.ts`; the policy itself is built in
`src/security/csp.ts`. It is a single-page app, so the public site and the embedded Studio share
one policy. Adding a script, font, image host or backend from anywhere but our own origin means
adding it there too, with a reason — `e2e/csp.spec.ts` fails otherwise.

Sandboxed sessions may have no network route to Sanity or Supabase. Prefer unit tests with
mocked helpers over anything that needs a live backend.

## Sanity

The Studio is embedded at `/studio` (`src/pages/Studio.tsx`) and is **lazy-loaded on purpose** —
it pulls in several MB. Keep it behind `React.lazy` and out of any eagerly imported module.

Schema types live in `src/sanity/schemaTypes/`. A content change is usually three coordinated
edits: the schema type, a query helper in `src/sanity/queryHelpers/`, and the loader that calls it.

## Conventions

- TypeScript is strict, with `noUnusedLocals`, `noUnusedParameters` and `verbatimModuleSyntax`.
  Use `import type` for type-only imports.
- Prettier is enforced by Husky + lint-staged on commit; `npm run format` fixes the tree.
- Every dependency you import must be declared in `package.json`. Do not rely on a transitive
  package being hoisted into `node_modules`.
- Branch per change, PR into `main` using `.github/pull_request_template.md`. Merging to `main`
  deploys, so never push there directly.
