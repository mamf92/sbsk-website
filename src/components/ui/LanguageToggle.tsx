import { Button } from './Buttons';
import type { Locale } from '../../utils/locale';

const TARGET: Record<Locale, { next: Locale; label: string; ariaLabel: string }> = {
  // Each label is written in the language it switches to, and marked with that `lang`, so a
  // visitor who cannot read the current page can still find the way out of it.
  nb: { next: 'en', label: 'EN', ariaLabel: 'EN – Change language to English' },
  en: { next: 'nb', label: 'NO', ariaLabel: 'NO – Bytt språk til norsk' },
};

/**
 * Switches between Norwegian and English. Sits beside the theme toggle and wears the same
 * `toggle` button. Controlled: the caller owns the locale (`useLocale()` in the header).
 *
 * The accessible name starts with the visible text (WCAG 2.5.3 Label in Name), as the theme
 * toggle's does.
 */
export function LanguageToggle({
  locale,
  onChange,
  className,
}: {
  locale: Locale;
  onChange: (next: Locale) => void;
  className?: string;
}) {
  const target = TARGET[locale];
  return (
    <Button
      variant="toggle"
      size="xs"
      lang={target.next}
      aria-label={target.ariaLabel}
      onClick={() => onChange(target.next)}
      className={className}
    >
      {target.label}
    </Button>
  );
}
