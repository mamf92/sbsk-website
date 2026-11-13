import { afterEach, describe, expect, it, vi } from 'vitest';
import { openExternal, safeExternalUrl, safeLinkUrl } from './safeUrl';

describe('safeExternalUrl', () => {
  it.each(['https://spond.com/landing/event/abc', 'http://example.com', 'HTTPS://EXAMPLE.COM/x'])(
    'accepts %s',
    (url) => {
      expect(safeExternalUrl(url)).toBe(url);
    },
  );

  it.each([
    ['javascript:alert(1)'],
    ['JavaScript:alert(1)'],
    [' javascript:alert(1)'],
    ['java\tscript:alert(1)'],
    ['java\nscript:alert(1)'],
    ['\u0001javascript:alert(1)'],
    ['data:text/html,<script>alert(1)</script>'],
    ['vbscript:msgbox(1)'],
    ['//evil.example/path'],
    ['/relative/path'],
    ['mailto:someone@example.com'],
    ['https://'],
    [''],
  ])('rejects %j', (url) => {
    expect(safeExternalUrl(url)).toBeNull();
  });

  it('trims stray whitespace an editor pasted around a URL', () => {
    expect(safeExternalUrl('  https://spond.com/x \n')).toBe('https://spond.com/x');
  });

  it('keeps a URL with a space in its path', () => {
    expect(safeExternalUrl('https://example.com/a b')).toBe('https://example.com/a b');
  });

  it.each([undefined, null, 42, {}, ['https://example.com']])('rejects non-string %j', (value) => {
    expect(safeExternalUrl(value)).toBeNull();
  });
});

describe('openExternal', () => {
  afterEach(() => vi.restoreAllMocks());

  it('opens a safe URL with noopener and noreferrer', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    openExternal('https://spond.com/x');
    expect(open).toHaveBeenCalledWith('https://spond.com/x', '_blank', 'noopener,noreferrer');
  });

  it('does nothing for an unsafe URL', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    openExternal('javascript:alert(1)');
    openExternal(undefined);
    expect(open).not.toHaveBeenCalled();
  });
});

describe('safeLinkUrl', () => {
  it.each(['mailto:post@example.com', 'tel:+4712345678', 'https://example.com'])(
    'accepts %s',
    (url) => {
      expect(safeLinkUrl(url)).toBe(url);
    },
  );

  it.each(['javascript:alert(1)', 'data:text/html,x', 'mailto:', 'tel:\t1', 'ftp://x'])(
    'rejects %j',
    (url) => {
      expect(safeLinkUrl(url)).toBeNull();
    },
  );
});
