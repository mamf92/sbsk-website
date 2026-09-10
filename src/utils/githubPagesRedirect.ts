// Counterpart to public/404.html's redirect script (see the comment there for why it exists —
// #22, the back-button-to-404 bug). That script packs the path GitHub Pages couldn't serve into
// a `?/`-prefixed query string and redirects to the real index.html. This unpacks it back into
// the real path with `history.replaceState`, before `createBrowserRouter` reads the location in
// main.tsx, so the router sees `/sbsk-website/kalender`, never the `?/kalender` placeholder.
//
// Split out as a pure function so the query-decoding logic — easy to get wrong, since it has to
// mirror the encoding on the other side exactly — is unit-testable without touching real
// `window.history`.

/** `pathname`/`search`/`hash` restored from the GitHub Pages redirect encoding, or `null` if
 *  this location was never redirected (the common case — everything except a 404 fallback). */
export function decodeGithubPagesRedirect(
  pathname: string,
  search: string,
  hash: string,
): string | null {
  if (search[1] !== '/') return null;

  const decoded = search
    .slice(1)
    .split('&')
    .map((segment) => segment.replace(/~and~/g, '&'))
    .join('?');

  // `pathname` is the redirect target's own base path with a trailing slash (see 404.html);
  // dropping it splices `decoded`'s leading `/` back into a single path.
  return pathname.slice(0, -1) + decoded + hash;
}

export function restoreGithubPagesRoute(location: Location = window.location): void {
  const restored = decodeGithubPagesRedirect(location.pathname, location.search, location.hash);
  if (restored !== null) window.history.replaceState(null, '', restored);
}
