import { useSyncExternalStore } from 'react';
import { getLocale, setLocale, subscribeLocale, type Locale } from '../../utils/locale';

/**
 * The active language and a setter that switches, persists and updates `<html lang>`.
 * No i18next here — see `src/utils/locale.ts` for why.
 */
export function useLocale(): { locale: Locale; setLocale: (next: Locale) => void } {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return { locale, setLocale };
}
