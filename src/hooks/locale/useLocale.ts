import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_LOCALE,
  getLocale,
  isTranslatedPath,
  setLocale,
  subscribeLocale,
  type Locale,
} from '../../utils/locale';
import { i18nEnabled } from '../../utils/featureFlags';

/**
 * The visitor's chosen language and a setter that switches and persists it.
 * No i18next here — see `src/utils/locale.ts` for why.
 */
export function useLocale(): { locale: Locale; setLocale: (next: Locale) => void } {
  const locale = useSyncExternalStore(subscribeLocale, getLocale, getLocale);
  return { locale, setLocale };
}

/** Whether the current route exists in English, so the toggle has something to switch. */
export function useIsTranslatedRoute(): boolean {
  const { pathname } = useLocation();
  return i18nEnabled && isTranslatedPath(safeDecode(pathname));
}

/**
 * Keeps `<html lang>` true to what is on screen: the chosen language on a translated route,
 * Norwegian everywhere else. Mounted once, in the shell.
 */
export function useDocumentLang() {
  const { locale } = useLocale();
  const translated = useIsTranslatedRoute();
  const lang = translated ? locale : DEFAULT_LOCALE;
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
}

function safeDecode(pathname: string): string {
  try {
    return decodeURIComponent(pathname);
  } catch {
    return pathname;
  }
}
