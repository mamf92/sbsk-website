// Shared by CalendarSection and PostsSection: both render a Sanity-authored `links[]` array
// whose `url` is often the full deployed URL an editor copied from the address bar, rather
// than a bare path.

// The site's real GitHub Pages origin — no `www.` subdomain, since GitHub user/project pages
// are served at `<user>.github.io` and this repo has no CNAME configuring a custom domain
// (see docs/ROADMAP.md's CSP notes, which name the same bare host).
const SITE_ORIGIN = 'https://mamf92.github.io/sbsk-website';

// The router's basename (`VITE_BASE`, "/sbsk-website/" on Pages) is not part of the paths
// `useNavigate()` expects — it prepends the basename itself (see main.tsx) — but it *is* part
// of `SITE_ORIGIN` and thus of `url` below, so it has to be stripped before handing a path to
// `navigate()`. Passing an already-based path straight to `navigate()` under a non-root
// basename double-applies it and the route fails to match, landing on the 404 page (#22).
// Mirrors `ROUTER_BASE` in portableTextComponents.tsx, which strips the same prefix for
// `<Link to>`.
const ROUTER_BASE = (import.meta.env.VITE_BASE || '/').replace(/\/+$/, '');

export function isInternalLink(url: string): boolean {
  return url.startsWith(SITE_ORIGIN);
}

/** `url` resolved to a basename-relative path, safe to pass to `useNavigate()`. Only meaningful
 *  once `isInternalLink(url)` is true. */
export function internalLinkPath(url: string): string {
  const path = new URL(url, window.location.href).pathname;
  if (ROUTER_BASE && path.startsWith(ROUTER_BASE)) {
    return path.slice(ROUTER_BASE.length) || '/';
  }
  return path;
}
