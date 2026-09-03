import { afterEach, describe, expect, it, vi } from 'vitest';

describe('internalLinks — root basename (test env default)', () => {
  it('recognizes the real site origin, without a www subdomain', async () => {
    const { isInternalLink } = await import('./internalLinks');
    expect(isInternalLink('https://mamf92.github.io/sbsk-website/kalender')).toBe(true);
    expect(isInternalLink('https://www.mamf92.github.io/sbsk-website/kalender')).toBe(false);
    expect(isInternalLink('https://example.com')).toBe(false);
  });

  it('resolves an internal URL to its pathname unchanged', async () => {
    const { internalLinkPath } = await import('./internalLinks');
    expect(internalLinkPath('https://mamf92.github.io/sbsk-website/kalender')).toBe(
      '/sbsk-website/kalender',
    );
  });
});

describe('internalLinks — deployed basename (VITE_BASE=/sbsk-website/)', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('strips the router basename so the result is safe to pass to navigate()', async () => {
    vi.stubEnv('VITE_BASE', '/sbsk-website/');
    vi.resetModules();
    const { internalLinkPath } = await import('./internalLinks');

    // The bug this pins (#22): passing the un-stripped pathname straight to `navigate()`
    // double-applies the basename react-router itself prepends, and the route fails to match.
    expect(internalLinkPath('https://mamf92.github.io/sbsk-website/kalender')).toBe('/kalender');
  });

  it('resolves the bare site root to "/", not an empty string', async () => {
    vi.stubEnv('VITE_BASE', '/sbsk-website/');
    vi.resetModules();
    const { internalLinkPath } = await import('./internalLinks');

    expect(internalLinkPath('https://mamf92.github.io/sbsk-website')).toBe('/');
    expect(internalLinkPath('https://mamf92.github.io/sbsk-website/')).toBe('/');
  });
});
