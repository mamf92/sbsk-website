import { useEffect, useSyncExternalStore } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DEFAULT_LOCALE,
  getLocale,
  isTranslatedContentShown,
  isTranslatedPath,
  markTranslatedContent,
  setLocale,
  subscribeTranslatedContent,
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

/** Whether this page is shown in English when chosen, so the toggle has something to switch. */
export function useIsTranslatedRoute(): boolean {
  const { pathname } = useLocation();
  const shown = useSyncExternalStore(
    subscribeTranslatedContent,
    isTranslatedContentShown,
    isTranslatedContentShown,
  );
  return i18nEnabled && shown && isTranslatedPath(safeDecode(pathname));
}

/** Mount in a translated page's real content, never in its error or placeholder states. */
export function useTranslatedContent() {
  useEffect(() => markTranslatedContent(), []);
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
