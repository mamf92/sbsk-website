# Hosting — what GitHub Pages can and cannot do

The site is a static bundle served by GitHub Pages from `main` (`.github/workflows/ci.yml`, the
`deploy` job). Pages serves files and nothing else: **there is no way to set a response header**,
no redirects file, no edge config, no server.

That single constraint is behind most of what an audit will flag about this site, and it is why
those findings are listed here as accepted rather than fixed. Anything below marked _not fixable
on Pages_ becomes fixable the day the site moves to a host that can send headers — Cloudflare
Pages, Netlify and Vercel all can — and this page is the checklist for that move.

Everything the platform _does_ let us do is done: see `src/security/csp.ts` for the policy that
rides in a `<meta>` element precisely because it cannot ride in a header.

## Caching

|                     |                                                            |
| ------------------- | ---------------------------------------------------------- |
| What Pages sends    | `Cache-Control: max-age=600` on every file, ours or Vite's |
| What it should send | `max-age=31536000, immutable` for `/assets/*`              |
| Fixable on Pages    | No                                                         |

Vite fingerprints every bundle it emits (`index-BCxt7uGE.js`), so those files are immutable by
construction and could be cached for a year. Pages gives them ten minutes, which is what
Lighthouse reports as ~1.5MB of "wasted bytes" on a repeat visit. Nothing in this repository
controls it.

Two things follow for anyone working here:

- Repeat-visit numbers from Lighthouse are not actionable. Read the cold-load numbers.
- Non-fingerprinted assets under `public/` — `public/images/hero/`, `public/fonts/` — are stale
  for at most ten minutes after a deploy, not indefinitely. That is what makes it safe to keep
  the hero derivatives in `public/` rather than importing them through the bundler, which is
  what lets `index.html` preload them by a URL known before the build.

## Security headers

`src/security/csp.ts` carries the reasoning for the policy itself. These are the headers an audit
asks for that the policy cannot carry, because a `<meta http-equiv>` CSP is not a header:

| Header                       | Fixable on Pages                  | Notes                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Cross-Origin-Opener-Policy` | No                                | Header-only. No `<meta>` equivalent exists.                                                                                                                                                                                                                                                                                               |
| `X-Frame-Options`            | No                                | Header-only. Its CSP equivalent, `frame-ancestors`, is [explicitly ignored](https://www.w3.org/TR/CSP3/#meta-element) in `<meta>` — so the site has no clickjacking mitigation at all. `frame-src 'none'` stops us framing others; it does nothing about others framing us.                                                               |
| `Strict-Transport-Security`  | No                                | Header-only. `github.io` is on the browsers' HSTS preload list, so HTTPS is enforced for the domain regardless; the `includeSubDomains`/`preload` directives an audit wants are GitHub's to send.                                                                                                                                         |
| `require-trusted-types-for`  | Technically yes, deliberately not | This one _can_ travel in a `<meta>` CSP. It is left off because it would break the page: React DOM assigns to `innerHTML` on paths this app reaches, and the embedded Sanity Studio is several megabytes of third-party editor code doing the same. Enabling it means auditing both, which is not a change this site can make on its own. |

## Other accepted findings

**Third-party cookies from `cdn.sanity.io`.** Hero and content images are served from Sanity's
image CDN, and the requests carry its cookies. The only ways out are proxying every image through
our own origin — which we have no server to do — or self-hosting the content images, which
defeats the point of a CMS. Accepted.

**No source maps in production** (`valid-source-maps`). `build.sourcemap` is off, so the shipped
bundles have none. Turning it on is one line in `vite.config.ts` and would make production stack
traces readable; the cost is that every map is uploaded to Pages on every deploy, and the
Studio's vendor chunk alone is over 4MB before mapping. Open decision, deliberately not taken
here.

## If the site moves off Pages

In rough order of what it buys:

1. `Cache-Control: max-age=31536000, immutable` on `/assets/*` — the largest single win, and free.
2. The CSP as a real `Content-Security-Policy` header, which gets `frame-ancestors 'none'` back
   and with it actual clickjacking protection.
3. `Cross-Origin-Opener-Policy: same-origin`.
4. Only then, and only with the audit it needs, Trusted Types.
