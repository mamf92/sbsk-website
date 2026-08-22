// The Supabase origin the e2e build is pointed at, shared by `playwright.config.ts` — which feeds
// it to Vite — and by the stub in `supabase.ts` that answers it. It lives in its own module
// because the config is typechecked without the DOM lib and cannot import the stub itself.
//
// A `*.supabase.co` host rather than a localhost port, for three reasons:
//
//   1. Every route glob in this suite matches `**://*.supabase.co/**`. Pointed at
//      `http://localhost:54321`, as it was, none of them matched: Supabase calls in e2e went
//      nowhere near a stub and simply failed to connect.
//   2. The CSP is built from this value (src/security/csp.ts), so the origin the app is allowed
//      to talk to follows automatically. A blocked request never reaches Playwright's router, so
//      a host outside `connect-src` cannot be stubbed at all.
//   3. supabase-js derives its storage key from the hostname, which makes the key below stable.
//
// Nothing is ever served from this host — every request to it is intercepted.
export const SUPABASE_URL = 'https://sbsk-test.supabase.co';

/** Public by design, and fake here: no request gets past the stub to be authenticated. */
export const SUPABASE_ANON_KEY = 'test-anon-key';

/**
 * Where supabase-js keeps the session. It builds this key as
 * `sb-${hostname.split('.')[0]}-auth-token` (see SupabaseClient's `defaultStorageKey`), so this
 * mirrors that derivation rather than hardcoding the result — change the URL above and the key
 * follows, exactly as it does inside the library.
 */
export const AUTH_STORAGE_KEY = `sb-${new URL(SUPABASE_URL).hostname.split('.')[0]}-auth-token`;
