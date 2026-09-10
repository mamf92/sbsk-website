import { describe, expect, it } from 'vitest';
import { decodeGithubPagesRedirect } from './githubPagesRedirect';

describe('decodeGithubPagesRedirect', () => {
  it('leaves an ordinary location alone', () => {
    expect(decodeGithubPagesRedirect('/sbsk-website/kalender', '', '')).toBeNull();
    expect(decodeGithubPagesRedirect('/sbsk-website/kalender', '?foo=bar', '')).toBeNull();
  });

  it('restores a bare redirected path', () => {
    expect(decodeGithubPagesRedirect('/sbsk-website/', '?/kalender', '')).toBe(
      '/sbsk-website/kalender',
    );
  });

  it('restores a nested path', () => {
    expect(decodeGithubPagesRedirect('/sbsk-website/', '?/arrangementer/123', '')).toBe(
      '/sbsk-website/arrangementer/123',
    );
  });

  it('restores a real query string carried alongside the encoded path', () => {
    expect(decodeGithubPagesRedirect('/sbsk-website/', '?/arrangementer/123&foo=bar', '')).toBe(
      '/sbsk-website/arrangementer/123?foo=bar',
    );
  });

  it('un-escapes a literal "&" that was part of the original query string', () => {
    // The 404.html redirect script replaces `&` with `~and~` before it becomes an `&`-joined
    // query segment separator itself, so a real `&` in the original query must come back intact.
    expect(decodeGithubPagesRedirect('/sbsk-website/', '?/kontakt-oss&a=1~and~2', '')).toBe(
      '/sbsk-website/kontakt-oss?a=1&2',
    );
  });

  it('preserves a hash fragment', () => {
    expect(decodeGithubPagesRedirect('/sbsk-website/', '?/om-oss', '#styret')).toBe(
      '/sbsk-website/om-oss#styret',
    );
  });

  it('round-trips the root path', () => {
    expect(decodeGithubPagesRedirect('/sbsk-website/', '?/', '')).toBe('/sbsk-website/');
  });
});
