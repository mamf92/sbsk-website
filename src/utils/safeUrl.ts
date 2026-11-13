// Every URL that comes from Sanity is untrusted at render time. Studio-side `rule.uri()`
// validation does not reach documents written directly against the Content Lake API, so a
// `javascript:` or `data:` URL can arrive in any URL field. These helpers are the one place
// that decides whether such a URL may reach an `href` or `window.open`.

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/** The URL if it is absolute http(s), else null. Never trust CMS URLs at render time. */
export function safeExternalUrl(url: unknown): string | null {
  if (typeof url !== 'string') return null;
  // An absolute http(s) URL never starts with whitespace or a control character. Browsers
  // strip those before parsing (`' javascript:'`, `'java\tscript:'`), so refuse them rather
  // than trying to normalise the same way every browser does.
  // eslint-disable-next-line no-control-regex
  if (/[\u0000- \u007f]/.test(url)) return null;
  // Protocol-relative (`//evil.example`) would inherit our scheme, but it also has no explicit
  // protocol for us to check, so it is refused.
  if (!/^https?:\/\//i.test(url)) return null;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;
  if (!parsed.hostname) return null;
  return url;
}

/** The host to name in "opens spond.com in a new tab", or null for an unsafe URL. */
export function externalHost(url: unknown): string | null {
  const safe = safeExternalUrl(url);
  if (!safe) return null;
  return new URL(safe).hostname.replace(/^www\./, '');
}

/** Opens a safe external URL in a new tab with no opener. A no-op for anything unsafe. */
export function openExternal(url: unknown): void {
  const safe = safeExternalUrl(url);
  if (!safe) return;
  window.open(safe, '_blank', 'noopener,noreferrer');
}
