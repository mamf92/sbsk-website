import { config } from 'zod';

/**
 * `script-src 'self'` in `src/security/csp.ts` has no `unsafe-eval`. Zod v4 probes for eval
 * access the first time a schema is built — a caught `new Function('')` deciding whether it
 * can JIT its validators — and the throw is swallowed, so the app itself never sees it. The
 * browser still reports a `securitypolicyviolation` on the attempt itself, though, and
 * `e2e/csp.spec.ts` catches it on *every* route: every file under `src/schemas/` is bundled
 * into the single entry chunk and evaluates at import time regardless of which route a visitor
 * is actually on.
 *
 * `jitless` skips that probe outright — zod's own documented fix for a strict CSP — and falls
 * back to its interpreted validator path, which is what this app was always going to use under
 * `'self'`-only anyway.
 *
 * The ordering is the whole point of this being a separate module: setting `jitless` from
 * `src/main.tsx`, after the router's page imports resolve, is too late — module evaluation
 * runs an importing module's own top-level code only *after* every one of its imports has
 * already run, and `contact.ts`'s `z.object(...)` (which is what triggers the probe) is one of
 * those imports. Every file in `src/schemas/` must import this module first, before defining
 * any schema, so the flag is set before that file's own first `z.object()` / `z.string()` call.
 */
config({ jitless: true });
