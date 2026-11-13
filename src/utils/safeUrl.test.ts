import { afterEach, describe, expect, it, vi } from 'vitest';
import { externalHost, openExternal, safeExternalUrl } from './safeUrl';

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
    ['https:// example.com'],
    [''],
  ])('rejects %j', (url) => {
    expect(safeExternalUrl(url)).toBeNull();
  });

  it.each([undefined, null, 42, {}, ['https://example.com']])('rejects non-string %j', (value) => {
    expect(safeExternalUrl(value)).toBeNull();
  });
});

describe('externalHost', () => {
  it('returns the host without www', () => {
    expect(externalHost('https://www.spond.com/x')).toBe('spond.com');
    expect(externalHost('https://club.spond.com/x')).toBe('club.spond.com');
  });

  it('returns null for an unsafe URL', () => {
    expect(externalHost('javascript:alert(1)')).toBeNull();
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
