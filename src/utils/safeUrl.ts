// Every URL that comes from Sanity is untrusted at render time. Studio-side `rule.uri()`
// validation does not reach documents written directly against the Content Lake API, so a
// `javascript:` or `data:` URL can arrive in any URL field. These helpers are the one place
// that decides whether such a URL may reach an `href` or `window.open`.

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:']);

/** The URL if it is absolute http(s), else null. Never trust CMS URLs at render time. */
export function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  // Editors paste URLs with stray spaces at either end, so those are trimmed. A control
  // character anywhere is refused rather than normalised: browsers silently drop tabs and
  // newlines while parsing (`'java\tscript:'`), and matching every browser's rules is not a
  // game worth playing.
  const url = value.trim();
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f]/.test(url)) return null;
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

/** Opens a safe external URL in a new tab with no opener. A no-op for anything unsafe. */
export function openExternal(url: unknown): void {
  const safe = safeExternalUrl(url);
  if (!safe) return;
  window.open(safe, '_blank', 'noopener,noreferrer');
}
