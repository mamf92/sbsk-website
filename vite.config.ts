import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import { buildContentSecurityPolicy, type CspOptions } from './src/security/csp.ts';

// GitHub Pages cannot set response headers, so the Content-Security-Policy has to ride in the
// HTML. It is injected here rather than written into index.html by hand because it depends on
// the Supabase URL, which differs between production, CI and the e2e suite. See src/security/csp.ts
// for what each directive buys and why the Studio forces a couple of them open.
function contentSecurityPolicy(options: CspOptions): Plugin {
  return {
    name: 'sbsk-csp',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => ({
        html,
        // A meta policy only governs what comes after it, so it has to be first in <head>.
        tags: [
          {
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: buildContentSecurityPolicy(options),
            },
            injectTo: 'head-prepend',
          },
        ],
      }),
    },
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_BASE || '/',
    plugins: [
      tailwindcss(),
      react(),
      svgr(),
      contentSecurityPolicy({ supabaseUrl: env.VITE_SUPABASE_URL, dev: command === 'serve' }),
    ],
  };
});
