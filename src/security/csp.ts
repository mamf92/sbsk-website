// The Content-Security-Policy the site ships with.
//
// GitHub Pages serves static files and gives us no way to set response headers, so the policy
// travels in a <meta http-equiv> element instead. That has three consequences worth knowing
// before editing anything here:
//
//   1. `frame-ancestors`, `report-uri`, `report-to` and `sandbox` are ignored in meta and log a
//      console warning if present, so they are deliberately absent. Clickjacking protection is
//      not available on Pages; it needs a host that can send headers.
//   2. The meta element must come before anything it is meant to govern. It is injected at the
//      very top of <head> by the plugin in vite.config.ts.
//   3. A document gets one policy, and this is a single-page app: the public site and the
//      embedded Studio at /studio share one index.html. There is no way to give the Studio a
//      looser policy than the rest of the site — the union of what both need is what everyone
//      gets. That is why the allowances below are justified one by one.

export type CspOptions = {
  /** `VITE_SUPABASE_URL`. Absent or unparseable means the Supabase origins are left out. */
  supabaseUrl?: string;
  /** True while `vite dev` is serving. Adds the relaxations the dev server itself needs. */
  dev?: boolean;
};

/**
 * Every Sanity host the app and the Studio talk to is a subdomain of sanity.io:
 * `<projectId>.api.sanity.io` for content, `cdn.sanity.io` for images, `api.sanity.io` for the
 * Studio's login handshake. A CSP host wildcard matches one or more leading labels, so this one
 * expression covers all three — but not bare `sanity.io`, which nothing requests.
 */
const SANITY = 'https://*.sanity.io';
const SANITY_WS = 'wss://*.api.sanity.io';

/**
 * Fallback avatar in ProfileForm and ProfileCard, shown when a member has no profile image.
 * Remove this entry the moment that placeholder becomes a local asset — it is the only
 * third-party host the public site loads anything from.
 */
const AVATAR_PLACEHOLDER = 'https://placehold.net';

/**
 * The Supabase project answers REST, auth and storage on its https origin and realtime on the
 * matching websocket one. Derived rather than hardcoded because the URL is an environment
 * variable: production points at the hosted project, CI and the e2e suite at
 * `http://localhost:54321`, where the websocket scheme has to be `ws:` rather than `wss:`.
 */
function supabaseOrigins(supabaseUrl: string | undefined): { http: string[]; ws: string[] } {
  const none = { http: [], ws: [] };
  if (!supabaseUrl) return none;

  try {
    const { origin, protocol, host } = new URL(supabaseUrl);
    return { http: [origin], ws: [`${protocol === 'http:' ? 'ws:' : 'wss:'}//${host}`] };
  } catch {
    // A missing scheme is the known failure here (see the Phase 0 notes in docs/ROADMAP.md):
    // `createClient` throws on it at import time, so the app is broken for reasons that have
    // nothing to do with the CSP. Emitting no origin keeps a malformed value out of the policy.
    return none;
  }
}

/** Builds the policy string, one directive per entry, in the order it is served. */
export function buildContentSecurityPolicy({ supabaseUrl, dev = false }: CspOptions = {}): string {
  const supabase = supabaseOrigins(supabaseUrl);

  const directives: Record<string, string[]> = {
    // Anything without its own directive below falls back to same-origin only.
    'default-src': ["'self'"],

    // The production bundle is external module scripts from our own origin and nothing else —
    // no inline script, no eval. `vite build` puts the modulepreload polyfill inside a chunk
    // rather than in the HTML, so there is nothing to hash or nonce. The dev server is the
    // exception: @vitejs/plugin-react injects the react-refresh preamble as an inline module.
    'script-src': dev ? ["'self'", "'unsafe-inline'"] : ["'self'"],

    // 'unsafe-inline' for styles is accepted rather than worked around. Two independent sources
    // need it: the Studio's styling library writes <style> elements at runtime, and a handful of
    // components (DiceLogo, Footer) size SVGs through a style attribute. Neither can be nonced
    // from a static file. The exposure is style injection, not script execution, which is the
    // trade the rest of this policy is built to make.
    'style-src': ["'self'", "'unsafe-inline'"],

    // Self-hosted .ttf files out of public/fonts. data: covers fonts inlined into CSS.
    'font-src': ["'self'", 'data:'],

    // blob: is for object URLs created while previewing an upload; the Supabase origin serves
    // the stored profile images through getPublicUrl.
    'img-src': ["'self'", 'data:', 'blob:', SANITY, AVATAR_PLACEHOLDER, ...supabase.http],

    'media-src': ["'self'", 'data:', 'blob:', ...supabase.http],

    // Sanity content and Supabase REST/auth/storage, plus the websockets both use for realtime.
    // In dev the HMR socket runs on the Vite server's own origin, which 'self' covers in current
    // browsers but not in every version that shipped ws: handling, so it is named explicitly.
    'connect-src': [
      "'self'",
      SANITY,
      SANITY_WS,
      ...supabase.http,
      ...supabase.ws,
      ...(dev ? ['ws://localhost:*', 'ws://127.0.0.1:*'] : []),
    ],

    // No app code creates a worker. blob: is here for the Studio, several megabytes of
    // minified third-party editor code that this policy cannot audit ahead of time.
    'worker-src': ["'self'", 'blob:'],

    // Nothing here embeds or is embedded, and there are no plugins or forms posting off-site.
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'form-action': ["'self'"],
    'base-uri': ["'self'"],
    'manifest-src': ["'self'"],
  };

  return Object.entries(directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}
