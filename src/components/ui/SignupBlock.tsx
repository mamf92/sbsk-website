import * as React from 'react';
import { Button } from './Buttons';
import { useEventsT } from '../../i18n';
import { pickLocale } from '../../i18n/pickLocale';
import { useLocale } from '../../hooks/locale/useLocale';
import type { SignupTypes } from '../../sanity/queryHelpers/fragments';
import { formatDateTime } from '../../utils/eventDateFormat';
import { openExternal, safeExternalUrl } from '../../utils/safeUrl';
import { signupState } from '../../utils/signup';

type SignupBlockProps = Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> & {
  signup: SignupTypes | null | undefined;
  /** The clock to judge opening and deadline against. Defaults to now. */
  now?: Date;
  /** For a programme row: a small secondary button and no hint line. */
  compact?: boolean;
};

const textClass = 'font-body text-sm';

/**
 * How to sign up, in whatever state that is right now (`signupState`): a button out to Spond
 * or another site, a "not open yet" or "closed" notice, or "just show up". Renders nothing when
 * there is no sign-up. One component for events, festivals, days and sessions, so the members
 * phase adds our own sign-up here rather than on every page.
 */
export const SignupBlock = React.forwardRef<HTMLDivElement, SignupBlockProps>(
  ({ signup, now, compact = false, className = '', ...props }, ref) => {
    const t = useEventsT();
    const { locale } = useLocale();
    const hintId = React.useId();
    const state = signupState(signup, now ?? new Date());
    if (state === 'none' || !signup) return null;

    const label = pickLocale(signup.label, locale);
    const note = pickLocale(signup.note, locale);
    const url = safeExternalUrl(signup.url);
    const host = url ? new URL(url).hostname.replace(/^www\./, '') : '';
    const at = (iso: string | undefined) => (iso ? formatDateTime(new Date(iso), locale) : '');

    let body: React.ReactNode;
    switch (state) {
      case 'open':
        body = (
          <>
            <Button
              variant={compact ? 'secondary' : 'primary'}
              size={compact ? 'sm' : 'lg'}
              icon="right"
              onClick={() => openExternal(url)}
              // The visible label is the button's name; the hint says where it goes.
              aria-describedby={compact ? undefined : hintId}
              lang={label?.lang !== locale ? label?.lang : undefined}
            >
              {label?.value ?? t('signup.default')}
            </Button>
            {!compact && (
              <p id={hintId} className={`${textClass} opacity-80`}>
                {t('signup.opensInNewTab', { host })}
                {signup.closes && <> · {t('signup.deadline', { date: at(signup.closes) })}</>}
              </p>
            )}
          </>
        );
        break;
      case 'notYetOpen':
        body = (
          <>
            {!compact && (
              <Button variant="disabled" size="lg" icon="right" disabled>
                {label?.value ?? t('signup.default')}
              </Button>
            )}
            <p className={textClass}>{t('signup.notYetOpen', { date: at(signup.opens) })}</p>
          </>
        );
        break;
      case 'closed':
        body = <p className={`${textClass} font-semibold`}>{t('signup.closed')}</p>;
        break;
      case 'dropIn':
        body = <p className={textClass}>{t('signup.dropIn')}</p>;
        break;
    }

    return (
      <div
        ref={ref}
        className={['flex flex-col items-start gap-2', className].join(' ')}
        {...props}
      >
        {body}
        {!compact && note && (
          <p className={textClass} lang={note.lang !== locale ? note.lang : undefined}>
            {note.value}
          </p>
        )}
      </div>
    );
  },
);

SignupBlock.displayName = 'SignupBlock';
