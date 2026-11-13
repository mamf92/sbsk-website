/**
 * The visitor's language, and the one place that reads, applies and persists it — the
 * counterpart of `theme.ts`. `src/i18n/` owns the translations; this file only owns the choice.
 *
 * Deliberately free of i18next: the header's toggle needs the choice on every page, but the
 * translations are only needed by the (lazy) event pages, so i18next stays out of the entry
 * chunk. `src/i18n/index.ts` subscribes here and follows along.
 *
 * Only some pages are translated (`isTranslatedPath`). Everywhere else the page stays
 * Norwegian and `<html lang>` says so, whatever the visitor chose; see `useDocumentLang`.
 */
import { i18nEnabled } from './featureFlags';

export const LOCALES = ['nb', 'en'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'nb';

/** Shared with the members phase, which mirrors the choice into `profiles.locale`. */
export const LOCALE_STORAGE_KEY = 'sbsk-locale';

export function isLocale(value: unknown): value is Locale {
  return (LOCALES as readonly unknown[]).includes(value);
}

/**
 * The routes that exist in English. The language toggle only shows on these, and only these
 * set `<html lang>` to the visitor's choice. Paths are router paths (no basename), decoded.
 * Grows as pages are translated; the full-site phase replaces it with "everything".
 */
const TRANSLATED_PATHS = [/^\/board-game-masters\/?$/, /^\/arrangementer\/[^/]+\/?$/];

export function isTranslatedPath(pathname: string): boolean {
  return TRANSLATED_PATHS.some((pattern) => pattern.test(pathname));
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

function storeLocale(locale: Locale) {
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
  // `nb-NO`, `nb_NO` (some embedded browsers), `no`, `nn`.
  return /^(nb|nn|no)([-_]|$)/i.test(first) ? 'nb' : 'en';
}

function browserLanguages(): readonly string[] {
  // An empty `languages` list is not "no preference": fall back to the single value.
  return navigator.languages?.length ? navigator.languages : [navigator.language];
}

export function getInitialLocale(): Locale {
  if (!i18nEnabled) return DEFAULT_LOCALE;
  return getStoredLocale() ?? detectLocale(browserLanguages());
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

/** Switches language: persists it and tells every subscriber. */
export function setLocale(next: Locale) {
  storeLocale(next);
  if (next === getLocale()) return;
  current = next;
  listeners.forEach((listener) => listener(next));
}

export function subscribeLocale(listener: (locale: Locale) => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Test-only. With an argument, pins the choice to that locale; without, forgets it so the
 * next `getLocale()` seeds itself from storage and the browser again. Notifies subscribers
 * either way, so i18next follows.
 */
export function resetLocaleForTests(locale?: Locale) {
  current = locale ?? null;
  const next = getLocale();
  listeners.forEach((listener) => listener(next));
}
