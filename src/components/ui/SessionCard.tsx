import * as React from 'react';
import { Button } from './Buttons';
import { SignupBlock } from './SignupBlock';
import { SponsorLogo } from './Sponsors';
import { Tag } from './Tag';
import { useEventsT } from '../../i18n';
import { pickLocale } from '../../i18n/pickLocale';
import { useLocale } from '../../hooks/locale/useLocale';
import { urlFor } from '../../sanity/sanityImageUrl';
import type { FestivalSessionTypes, SessionFormat } from '../../sanity/queryHelpers/festivals';
import type { SponsorTypes } from '../../sanity/queryHelpers/fragments';
import { clockTime } from '../../utils/eventDateFormat';

export type SessionStatus = 'now' | 'next';

type SessionCardProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  session: FestivalSessionTypes;
  /** The session's instants, from `sessionDateTimes`. */
  start: Date;
  end: Date;
  status?: SessionStatus;
  /** The festival sponsor named by `session.sponsor`, when there is one. */
  sponsor?: SponsorTypes;
  now?: Date;
};

// Competitive formats in orange, teaching formats in blue; the rest are named in plain text, so
// the coloured tags stay meaningful when a day has thirty sessions.
const FORMAT_TONE: Partial<Record<SessionFormat, 'orange' | 'blue'>> = {
  turnering: 'orange',
  finale: 'orange',
  'laer-a-spille': 'blue',
  demo: 'blue',
};

// Beyond about two lines on a phone, the description collapses behind «Vis mer».
const LONG_DESCRIPTION = 140;

/**
 * One item in a festival programme: time, format, title, game, where, and its own sign-up when
 * it has one. «Nå» and «Neste» are written out, and «Nå» also gets an orange edge, so the
 * state never rests on colour alone.
 */
export const SessionCard = React.forwardRef<HTMLElement, SessionCardProps>(
  ({ session, start, end, status, sponsor, now, className = '', ...props }, ref) => {
    const t = useEventsT();
    const { locale } = useLocale();
    const [expanded, setExpanded] = React.useState(false);
    const descriptionId = React.useId();

    const title = pickLocale(session.title, locale);
    const description = pickLocale(session.description, locale);
    // Only the editor's title and the game's name are Norwegian content; the format fallback is
    // our own translated label, so it carries no `lang` of its own.
    const headingLang = title ? title.lang : session.game?.name ? 'nb' : undefined;
    const heading = title?.value ?? session.game?.name ?? t(`format.${session.format ?? 'annet'}`);
    const tone = session.format ? FORMAT_TONE[session.format] : undefined;
    const long = (description?.value.length ?? 0) > LONG_DESCRIPTION;
    const game = session.game;
    const langOf = (lang?: string) => (lang && lang !== locale ? lang : undefined);

    return (
      <article
        ref={ref}
        className={[
          'font-body dark:bg-darkestblue flex gap-4 border border-black bg-white p-4 dark:border-white',
          status === 'now' ? 'border-l-orange border-l-4' : '',
          className,
        ].join(' ')}
        {...props}
      >
        {game?.image && (
          <img
            src={urlFor(game.image).width(128).height(128).fit('crop').auto('format').url()}
            alt=""
            width={64}
            height={64}
            loading="lazy"
            className="h-16 w-16 flex-none object-cover"
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <time dateTime={start.toISOString()} className="font-bold">
              {clockTime(start)}–{clockTime(end)}
            </time>
            {session.format &&
              (tone ? (
                <Tag tone={tone}>{t(`format.${session.format}`)}</Tag>
              ) : (
                <span className="opacity-80">{t(`format.${session.format}`)}</span>
              ))}
            {status && (
              <Tag tone={status === 'now' ? 'orange' : 'blue'}>{t(`program.${status}`)}</Tag>
            )}
          </div>

          <h4 className="font-heading text-h4 font-bold" lang={langOf(headingLang)}>
            {heading}
          </h4>

          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
            {game?.name && title && <li lang={langOf('nb')}>{game.name}</li>}
            {game?.minPlayers && game.maxPlayers && (
              <li>{t('program.players', { min: game.minPlayers, max: game.maxPlayers })}</li>
            )}
            {session.room && (
              <li>
                <span className="sr-only">{t('program.room')}: </span>
                <span lang={langOf('nb')}>{session.room}</span>
              </li>
            )}
            {typeof session.seats === 'number' && session.seats > 0 && (
              <li>{t('program.seats', { count: session.seats })}</li>
            )}
            {session.level && <li>{t(`program.level.${session.level}`)}</li>}
          </ul>

          {description && (
            <div className="flex flex-col items-start gap-1">
              <p
                id={descriptionId}
                lang={langOf(description.lang)}
                className={`text-sm whitespace-pre-line ${long && !expanded ? 'line-clamp-2' : ''}`}
              >
                {description.value}
              </p>
              {long && (
                <Button
                  variant="tertiary"
                  size="xs"
                  aria-expanded={expanded}
                  aria-controls={descriptionId}
                  onClick={() => setExpanded((open) => !open)}
                >
                  {expanded ? t('program.showLess') : t('program.showMore')}
                </Button>
              )}
            </div>
          )}

          {sponsor && (
            <div className="flex items-center gap-2 text-sm">
              <span>{t('sponsors.presentedBy')}</span>
              <SponsorLogo sponsor={sponsor} size="partner" />
            </div>
          )}

          <SignupBlock signup={session.signup ?? undefined} now={now} compact />
        </div>
      </article>
    );
  },
);

SessionCard.displayName = 'SessionCard';
