import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { SanityImageSource } from '@sanity/image-url';
import type { CalendarEventTypes } from '../../../sanity/queryHelpers/events';
import { HeroImage } from '../../ui/HeroImage';
import { Eyebrow } from '../../ui/Eyebrow';
import { Button } from '../../ui/Buttons';
import { buttonClasses } from '../../ui/buttonClasses';
import { TextLink } from '../../ui/TextLink';
import { countdownLabel } from '../../../utils/eventHighlights';
import { calendarEventIcs } from '../../../utils/eventIcs';
import { downloadIcs } from '../../../utils/ics';
import { mapUrl } from '../../../utils/mapUrl';
import { siteUrl } from '../../../utils/siteUrl';
import {
  dayOfMonth,
  formatDayLong,
  monthAbbreviation,
  timeRange,
} from '../../../utils/eventDateFormat';
import { eventCategory } from './eventStyles';
import Clock from '../../../assets/icons/symbols/clock.svg?react';
import Pin from '../../../assets/icons/symbols/locationpin.svg?react';
import Meeple from '../../../assets/icons/symbols/meeple.svg?react';
import AlertTriangle from '../../../assets/icons/symbols/alert-triangle.svg?react';

function capitalise(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * The new front page's hero: the next game night IS the hero. Its date at poster size, time and
 * place, «Legg i kalenderen», and the «bare møt opp» promise; a polaroid of the club's hero photo
 * with a «Første gang?» sticker. A ticker under it lists what comes after.
 *
 * `member` swaps the visitor's actions and promise for the member's own (greeting, sign-up, who
 * is coming) and the sticker text.
 */
export function NextEventHero({
  next,
  later,
  photo,
  now,
  member,
}: {
  next: CalendarEventTypes | null;
  later: CalendarEventTypes[];
  photo?: SanityImageSource | null;
  now: Date;
  member?: { eyebrow: string; greeting: ReactNode; actions: ReactNode; sticker: string };
}) {
  const start = next ? new Date(next.eventStartTime) : null;
  const end = next ? new Date(next.eventEndTime) : null;
  const isNight = next?.category === 'spillkveld' && !next.festivalDay;
  return (
    <section
      aria-labelledby="neste-arrangement"
      className="bg-darkblue surface-dark dot-pattern relative overflow-hidden text-white"
    >
      <div className="max-w-shell relative mx-auto grid items-center gap-10 px-4 pt-8 pb-10 sm:px-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:pt-12 lg:pb-14">
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>
              <span id="neste-arrangement">
                {member?.eyebrow ?? (isNight || !next ? 'Neste spillkveld' : 'Neste arrangement')}
              </span>
            </Eyebrow>
            {start && (
              <span className="font-heading text-sm font-bold text-white/80">
                {countdownLabel(start, now)}
              </span>
            )}
          </div>
          {member?.greeting}
          {next?.frontPageNotice?.trim() && (
            // «Beskjed på forsiden»: the one-off news about this night (cancelled, new venue),
            // where everyone who checks «is there something tonight?» will see it.
            <p className="font-heading text-darkestblue border-orange flex w-fit items-center gap-2.5 border-l-8 bg-white px-3 py-2 text-lg font-extrabold">
              <AlertTriangle aria-hidden="true" className="h-5 w-5 flex-none fill-current" />
              <span>
                <span className="sr-only">Beskjed: </span>
                {next.frontPageNotice.trim()}
              </span>
            </p>
          )}
          {next && start && end ? (
            <>
              <p className="font-heading text-poster font-extrabold">
                {capitalise(formatDayLong(start, 'nb'))}
              </p>
              {!isNight && <p className="font-heading text-h2 -mt-2 font-bold">{next.title}</p>}
              <div className="font-body flex flex-col gap-2 text-lg">
                <span className="inline-flex items-center gap-2.5">
                  <Clock
                    aria-hidden="true"
                    className="text-orange h-5 w-5 flex-none fill-current"
                  />
                  {next.allDay ? 'Hele dagen' : timeRange(start, end)}
                </span>
                {next.location && (
                  <span className="inline-flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <Pin
                      aria-hidden="true"
                      className="text-orange h-5 w-5 flex-none fill-current"
                    />
                    {next.location}
                    <a
                      href={mapUrl(next.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="focus-visible:outline-focus-ring text-sm underline underline-offset-4 opacity-85 hover:opacity-100 focus-visible:outline-2"
                    >
                      Vis i kart
                    </a>
                  </span>
                )}
              </div>
            </>
          ) : (
            <p className="font-heading text-h1 font-bold">
              Neste spillkveld er ikke lagt inn ennå.
            </p>
          )}

          {member ? (
            member.actions
          ) : (
            <>
              <div className="flex flex-wrap gap-3 pt-2">
                {next && (
                  <Button
                    variant="primary"
                    size="lg"
                    icon="calendar"
                    className="max-sm:w-full"
                    onClick={() =>
                      downloadIcs(calendarEventIcs(next, siteUrl()), 'sbsk-arrangement.ics')
                    }
                  >
                    Legg i kalenderen
                  </Button>
                )}
                <Link
                  to="/om-oss"
                  className={buttonClasses({
                    variant: 'tertiary',
                    size: 'lg',
                    className: 'border-2 border-white max-sm:w-full',
                  })}
                >
                  Hva er SBSK?
                </Link>
              </div>
              {(isNight || !next) && (
                <p className="font-body border-orange max-w-[60ch] border-l-4 pl-4 text-base text-white/90">
                  Ingen påmelding og ingen spill å ta med. Bare møt opp, så finner vi et bord til
                  deg.
                </p>
              )}
            </>
          )}
        </div>

        {/* The one place a photo of people earns its space: a polaroid, not a full-bleed band. */}
        <div className="max-w-aside relative mx-auto w-full lg:mx-0 lg:justify-self-end">
          <div className="bg-cream text-darkestblue tilt-right-lg relative border border-black p-3 pb-14 shadow-[10px_10px_0_var(--color-darkestblue)]">
            <div className="relative aspect-[4/3] overflow-hidden border border-black">
              <HeroImage image={photo} priority />
            </div>
            <span className="font-heading absolute bottom-4 left-4 -rotate-1 text-lg font-bold">
              {next?.location
                ? `Spillkveld på ${next.location.split(',')[0]}`
                : 'Spillkveld i SBSK'}
            </span>
          </div>
          <span
            aria-hidden="true"
            className="font-heading bg-orange text-darkestblue border-darkestblue absolute -top-6 -left-3 flex size-26 -rotate-12 items-center justify-center rounded-full border-2 p-3 text-center text-sm leading-tight font-extrabold sm:-left-8 sm:size-32 sm:text-base"
          >
            {member?.sticker ?? 'Første gang? Bare møt opp!'}
          </span>
          <Meeple
            aria-hidden="true"
            className="text-orange absolute -right-3 -bottom-6 h-20 w-20 rotate-6 drop-shadow-[4px_4px_0_var(--color-darkestblue)]"
          />
        </div>
      </div>

      {/* What comes after, as a ticker rather than a second hero. */}
      <div className="bg-darkestblue relative border-t border-white/15">
        <div className="max-w-shell font-body mx-auto flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 text-sm sm:px-6">
          {later.length > 0 && (
            <>
              <span className="font-heading text-orange text-xs font-extrabold tracking-[0.16em] uppercase">
                Deretter
              </span>
              <ul className="contents">
                {later.map((event) => {
                  const date = new Date(event.eventStartTime);
                  return (
                    <li key={event._id} className="inline-flex items-center gap-2">
                      <span
                        aria-hidden="true"
                        className={`size-2.5 flex-none outline-1 outline-white/60 ${eventCategory(event.category).chip}`}
                      />
                      <strong className="font-heading whitespace-nowrap">
                        {dayOfMonth(date)}. {monthAbbreviation(date)}
                      </strong>
                      {event.title}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          <span className="ml-auto">
            <TextLink to="/kalender">Hele kalenderen</TextLink>
          </span>
        </div>
      </div>
    </section>
  );
}
