import type { Locale } from '../utils/locale';

/** A Sanity `localeString`/`localeText`/`localeBlock` value: Norwegian required, English optional. */
export type LocaleValue<T> = { nb?: T; en?: T } | undefined | null;

export type Picked<T> = {
  value: T;
  /** The language `value` is actually in, for a `lang` attribute when it differs from the page. */
  lang: Locale;
};

function isPresent<T>(value: T | undefined | null): value is T {
  if (value == null) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * The text for `locale`, falling back to Norwegian. Returns `null` when neither exists, so a
 * caller renders nothing rather than an empty element. The returned `lang` lets the caller mark
 * Norwegian fallback text on an English page, so screen readers pronounce it correctly.
 */
export function pickLocale<T>(value: LocaleValue<T>, locale: Locale): Picked<T> | null {
  if (!value) return null;
  if (locale === 'en' && isPresent(value.en)) return { value: value.en, lang: 'en' };
  if (isPresent(value.nb)) return { value: value.nb, lang: 'nb' };
  if (isPresent(value.en)) return { value: value.en, lang: 'en' };
  return null;
}
