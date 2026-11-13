/**
 * The visitor's language, and the one place that reads, applies and persists it — the
 * counterpart of `theme.ts`. `src/i18n/` owns the translations; this file only owns the choice.
 *
 * Deliberately free of i18next: the header's toggle needs the choice on every page, but the
 * translations are only needed by the (lazy) event pages, so i18next stays out of the entry
 * chunk. `src/i18n/index.ts` subscribes here and follows along.
 */
import { i18nEnabled } from './featureFlags';

export const LOCALES = ['nb', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'nb';

/** Shared with the members phase, which mirrors the choice into `profiles.locale`. */
export const LOCALE_STORAGE_KEY = 'sbsk-locale';

export function isLocale(value: unknown): value is Locale {
  return value === 'nb' || value === 'en';
}

/** Wrapped because `localStorage` throws instead of returning null in some private modes. */
function getStoredLocale(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

export function storeLocale(locale: Locale) {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* storage unavailable — the choice holds for this visit only */
  }
}

/**
 * English only when the browser clearly prefers a language that is not Norwegian. The club's
 * audience is Norwegian, so anything uncertain (no language, an empty list) means `nb`.
 */
export function detectLocale(languages: readonly string[] | undefined): Locale {
  const first = languages?.find((language) => typeof language === 'string' && language);
  if (!first) return DEFAULT_LOCALE;
  return /^(nb|nn|no)\b/i.test(first) ? 'nb' : 'en';
}

export function getInitialLocale(): Locale {
  if (!i18nEnabled) return DEFAULT_LOCALE;
  return getStoredLocale() ?? detectLocale(navigator.languages ?? [navigator.language]);
}

export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
}

/** The BCP 47 tag `Intl` date and number formatting should use for a locale. */
export function dateLocale(locale: Locale): string {
  return locale === 'en' ? 'en-GB' : 'nb-NO';
}

/* -------------------------------------------------------------------------- */
/* The current choice, as a tiny store React can subscribe to                  */
/* -------------------------------------------------------------------------- */

let current: Locale | null = null;
const listeners = new Set<(locale: Locale) => void>();

export function getLocale(): Locale {
  if (current === null) current = getInitialLocale();
  return current;
}

/** Switches language: persists it, updates `<html lang>` and tells every subscriber. */
export function setLocale(next: Locale) {
  storeLocale(next);
  applyLocale(next);
  if (next === current) return;
  current = next;
  listeners.forEach((listener) => listener(next));
}

export function subscribeLocale(listener: (locale: Locale) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Runs next to `initTheme()` in `main.tsx`, so `<html lang>` is right before first paint. */
export function initLocale() {
  applyLocale(getLocale());
}

/** Test-only: forget the in-memory choice so the next read starts from storage again. */
export function resetLocaleForTests(locale: Locale = DEFAULT_LOCALE) {
  current = locale;
  applyLocale(locale);
  listeners.forEach((listener) => listener(locale));
}
