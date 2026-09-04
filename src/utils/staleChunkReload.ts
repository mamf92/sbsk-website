// Every route below Home is its own content-hashed chunk (main.tsx), fetched by the filename
// baked into the bundle a visitor's tab loaded. A later deploy replaces every hashed file and
// removes the old ones (ci.yml uploads a fresh `dist/` each time), so a tab left open across a
// deploy — or one whose index.html a CDN edge served a moment before the matching assets
// finished propagating — asks for a chunk that is simply gone. Vite's preload helper reports
// that as a `vite:preloadError` event on `window` rather than an ordinary unhandled rejection.
//
// A full reload is the fix: it re-fetches index.html, which references the *current* deploy's
// hashes. `RELOAD_GUARD_KEY` stops a genuinely missing chunk (a real bug, not staleness) from
// reload-looping the tab — it fails once into RouteError's generic state instead.
const RELOAD_GUARD_KEY = 'sbsk-stale-chunk-reload';

export function recoverFromStaleChunks(): void {
  // Reaching this line means the entry chunk itself resolved, so any earlier reload attempt
  // already worked — clear the guard so a deploy that lands later in this same tab still gets
  // its own retry.
  sessionStorage.removeItem(RELOAD_GUARD_KEY);

  window.addEventListener('vite:preloadError', () => {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY)) return;
    sessionStorage.setItem(RELOAD_GUARD_KEY, '1');
    window.location.reload();
  });
}
