import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { decodeGithubPagesRedirect } from './githubPagesRedirect';

// public/404.html carries a CSP that allow-lists its own inline redirect script by sha256 hash
// (see the comment in that file, and #22). Prettier is not allowed near it — a reformat changes
// the script's exact bytes and silently invalidates the hash, which the browser would then
// enforce by *blocking* the script: the one thing the fix depends on doing something. This test
// recomputes the hash from the file on disk so that mismatch fails CI instead of shipping quietly.

describe('public/404.html', () => {
  const html = readFileSync(resolve(__dirname, '../../public/404.html'), 'utf8');

  it('is excluded from prettier, since its script must stay byte-for-byte stable', () => {
    const prettierIgnore = readFileSync(resolve(__dirname, '../../.prettierignore'), 'utf8');
    expect(prettierIgnore).toContain('public/404.html');
  });

  it('CSP script-src hash matches the actual inline script', () => {
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeTruthy();

    const actualHash = `sha256-${createHash('sha256').update(script!, 'utf8').digest('base64')}`;
    const declaredHash = html.match(/script-src 'sha256-[^']+'/)?.[0];

    expect(declaredHash).toBe(`script-src '${actualHash}'`);
  });

  // The script itself is deliberately not a module — it has to run with zero dependencies as a
  // static asset, unreachable from unit tests through an import. `vm.runInNewContext` executes
  // the real, shipped bytes against a stubbed `window.location`, so this pins actual behaviour
  // rather than a reimplementation that could drift from what ships.
  function runRedirectScript(pathname: string, search = '', hash = ''): string {
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    if (!script) throw new Error('no <script> found in public/404.html');

    let redirectedTo: string | undefined;
    runInNewContext(script, {
      window: {
        location: {
          protocol: 'https:',
          hostname: 'mamf92.github.io',
          port: '',
          pathname,
          search,
          hash,
          replace: (url: string) => {
            redirectedTo = url;
          },
        },
      },
    });
    if (redirectedTo === undefined) throw new Error('script never called location.replace');
    return redirectedTo;
  }

  it.each([
    ['/sbsk-website/kalender', '', ''],
    ['/sbsk-website/arrangementer/123', '', ''],
    ['/sbsk-website/arrangementer/123', '?foo=bar', ''],
    ['/sbsk-website/om-oss', '', '#styret'],
    ['/sbsk-website/kontakt-oss', '?a=1&b=2', ''],
  ])(
    'round-trips %s (search=%s, hash=%s) through decodeGithubPagesRedirect',
    (pathname, search, hash) => {
      const redirectedTo = runRedirectScript(pathname, search, hash);
      const url = new URL(redirectedTo);

      expect(decodeGithubPagesRedirect(url.pathname, url.search, url.hash)).toBe(
        pathname + search + hash,
      );
    },
  );
});
