import { describe, expect, it, vi } from 'vitest';
import { dateLocale, detectLocale, getInitialLocale, LOCALE_STORAGE_KEY } from './locale';

describe('detectLocale', () => {
  it.each([
    [['nb-NO'], 'nb'],
    [['nn'], 'nb'],
    [['no'], 'nb'],
    [['en-US', 'nb'], 'en'],
    [['de-DE'], 'en'],
    [[], 'nb'],
    [undefined, 'nb'],
  ] as const)('%j → %s', (languages, expected) => {
    expect(detectLocale(languages as readonly string[] | undefined)).toBe(expected);
  });
});

describe('getInitialLocale', () => {
  it('prefers a stored choice over the browser', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    expect(getInitialLocale()).toBe('en');
  });

  it('ignores a stored value that is not a locale', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['nb-NO']);
    expect(getInitialLocale()).toBe('nb');
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['nb-NO']);
    expect(getInitialLocale()).toBe('nb');
  });
});

describe('getInitialLocale with the flag off', () => {
  it('is always Norwegian', async () => {
    vi.resetModules();
    vi.doMock('./featureFlags', () => ({ i18nEnabled: false }));
    const { getInitialLocale: initial } = await import('./locale');
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    expect(initial()).toBe('nb');
    vi.doUnmock('./featureFlags');
  });
});

describe('dateLocale', () => {
  it('maps to Intl tags', () => {
    expect(dateLocale('nb')).toBe('nb-NO');
    expect(dateLocale('en')).toBe('en-GB');
  });
});
