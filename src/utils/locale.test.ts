import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  detectLocale,
  getInitialLocale,
  getLocale,
  isTranslatedPath,
  LOCALE_STORAGE_KEY,
  resetLocaleForTests,
  setLocale,
  subscribeLocale,
} from './locale';

describe('detectLocale', () => {
  it.each([
    [['nb-NO'], 'nb'],
    [['nb_NO'], 'nb'],
    [['nn'], 'nb'],
    [['no'], 'nb'],
    [['en-US', 'nb'], 'en'],
    [['de-DE'], 'en'],
    [['nbx'], 'en'],
    [[], 'nb'],
    [undefined, 'nb'],
  ] as const)('%j → %s', (languages, expected) => {
    expect(detectLocale(languages as readonly string[] | undefined)).toBe(expected);
  });
});

describe('getInitialLocale', () => {
  it('prefers a stored choice over the browser', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['nb-NO']);
    expect(getInitialLocale()).toBe('en');
  });

  it('ignores a stored value that is not a locale', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'fr');
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['nb-NO']);
    expect(getInitialLocale()).toBe('nb');
  });

  it('falls back to navigator.language when the languages list is empty', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue([]);
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    expect(getInitialLocale()).toBe('en');
  });

  it('survives storage that throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('denied');
    });
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['nb-NO']);
    expect(getInitialLocale()).toBe('nb');
  });
});

describe('the locale store', () => {
  it('seeds itself from storage on first read', () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    resetLocaleForTests();
    expect(getLocale()).toBe('en');
  });

  it('persists a choice and notifies subscribers only on a change', () => {
    resetLocaleForTests('nb');
    const listener = vi.fn();
    const unsubscribe = subscribeLocale(listener);
    setLocale('en');
    setLocale('en');
    unsubscribe();
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en');
    expect(getLocale()).toBe('en');
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith('en');
  });
});

describe('isTranslatedPath', () => {
  it.each(['/board-game-masters', '/arrangementer/hostturnering', '/arrangementer/bgm-xix/'])(
    '%s is translated',
    (path) => expect(isTranslatedPath(path)).toBe(true),
  );
  it.each(['/', '/kalender', '/arrangementer', '/om-oss', '/arrangementer/a/b'])(
    '%s is not',
    (path) => expect(isTranslatedPath(path)).toBe(false),
  );
});

describe('getInitialLocale with the flag off', () => {
  afterEach(() => {
    vi.doUnmock('./featureFlags');
    vi.resetModules();
  });

  it('is always Norwegian', async () => {
    vi.resetModules();
    vi.doMock('./featureFlags', () => ({ i18nEnabled: false }));
    const { getInitialLocale: initial } = await import('./locale');
    localStorage.setItem(LOCALE_STORAGE_KEY, 'en');
    expect(initial()).toBe('nb');
  });
});
