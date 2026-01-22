# Copilot instructions (sbsk-website)

## Project snapshot

- Frontend-only Vite + React + TypeScript app (no backend code in this repo).
- Routing via React Router `createBrowserRouter` in `src/main.tsx`; top-level layout is `src/App.tsx` (Header + Footer + `<Outlet />`).
- UI is Tailwind CSS v4 (Vite plugin) with project colors/fonts in `src/index.css`.
- Audience is Norwegian-first: prefer Norwegian UI copy and Norwegian route slugs (keep router + links consistent for non-ASCII paths like `/vårespill`).

## Dev workflow (use npm scripts)

- Dev server: `npm run dev`
- Production build: `npm run build` (runs `tsc -b` then `vite build`)
- Preview build: `npm run preview`
- Lint/format: `npm run lint` and `npm run format` (Husky + lint-staged run Prettier + ESLint fixes).

## Env + deploy

- Uses Vite env vars: only `VITE_*` is exposed to the client via `import.meta.env`.
- Keep dev/prod separation via `.env.local` (dev) and `.env.production` (prod). Some prod values may be intentionally blank until hosting is decided.
- GitHub Pages SPA deploy may require copying `dist/index.html` to `dist/404.html` in CI so deep links work (do this in your CI/CD before publishing `dist/`).

## Routing + pages

- Add routes in `src/main.tsx` under the `/` layout route.
- Pages live in `src/pages/*` and should export a default React component.
- Use `<NavLink>` for router navigation and `react-router-hash-link` for `/#section` style in-page navigation (see `src/components/layout/Footer.tsx`).

## Components

- Layout components: `src/components/layout/*` (Header/Footer).
- Reusable UI primitives: `src/components/ui/*`.
- Prefer using the shared `Button` component in `src/components/ui/Buttons.tsx`.
  - Use the `icon` prop (e.g. `icon="moon"`, `icon="right"`) rather than inventing new props.

## Styling conventions (Tailwind v4)

- Tailwind is loaded via `@import 'tailwindcss';` in `src/index.css`.
- Theme tokens are declared using `@theme { ... }` in `src/index.css` (e.g. `bg-darkblue`, `font-heading`).
- Dark mode is class-based: `document.documentElement.classList.toggle('dark')` (see `src/components/layout/Header.tsx`).

## SVGs and assets

- SVG icons are imported as React components using SVGR with the `?react` suffix (see `src/components/ui/Buttons.tsx`).
- The `?react` typing lives in `src/vite-env.d.ts`; keep it in sync if changing SVG import patterns.

## TypeScript + linting constraints

- TypeScript is strict (`tsconfig.app.json`) and uses bundler resolution; do not rely on type errors being emitted at build time (noEmit).
- ESLint is configured in `eslint.config.js` (typescript-eslint + react hooks + react-refresh); Prettier formatting is enforced via `eslint-config-prettier`.

## Notes on integrations

- Sanity CMS: the Studio lives in a separate “SBSK studio” repo (projectId `85tc4tb0`, dataset `production`); this repo currently has no Sanity client/config in `src/`.
- Supabase is planned later for auth + members/board admin areas; don’t add early DB/auth wiring unless it’s part of the current milestone.

## Project intent

- This is a student project with a near-term MVP + first GitHub Pages preview; prefer best-practice suggestions that improve quality without adding heavy architecture.
