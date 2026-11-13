import i18n from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import nbEvents from './locales/nb/events.json';
import enEvents from './locales/en/events.json';
import { DEFAULT_LOCALE, getLocale, subscribeLocale } from '../utils/locale';

/**
 * Translations for the event pages. Import this module only from lazily loaded pages and
 * sections, never from the shell: it is what pulls i18next into a bundle, and the entry chunk
 * should not pay for it (`src/utils/locale.ts` owns the language choice without it).
 *
 * Norwegian is the source of truth; `en` must have exactly the same keys (`i18n.test.tsx`
 * fails otherwise). Bundled rather than fetched, so there is no new CSP origin and no loading
 * state. More namespaces (`common` for header and footer) come with the full-site phase.
 */
export const resources = {
  nb: { events: nbEvents },
  en: { events: enEvents },
} as const;

if (!i18n.isInitialized) {
  void i18n.use(initReactI18next).init({
    resources,
    lng: getLocale(),
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: ['nb', 'en'],
    ns: ['events'],
    defaultNS: 'events',
    // React escapes what it renders; escaping here as well would double-encode `&` and `<`.
    interpolation: { escapeValue: false },
    // Resources are bundled, so there is nothing to wait for.
    initAsync: false,
  });
  // Follow the header toggle. react-i18next re-renders every `useTranslation` consumer.
  subscribeLocale((locale) => void i18n.changeLanguage(locale));
}

/** `t` for the event pages. */
export function useEventsT() {
  return useTranslation('events').t;
}

export default i18n;
