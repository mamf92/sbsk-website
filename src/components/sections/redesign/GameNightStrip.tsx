import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { CalendarEventTypes } from '../../../sanity/queryHelpers/events';
import { Eyebrow } from '../../ui/Eyebrow';
import { countdownLabel, isSpecialEvent } from '../../../utils/eventHighlights';
import {
  clockTime,
  dayOfMonth,
  formatDayLong,
  monthAbbreviation,
  weekdayAbbreviation,
} from '../../../utils/eventDateFormat';
import Clock from '../../../assets/icons/symbols/clock.svg?react';
import Pin from '../../../assets/icons/symbols/locationpin.svg?react';
import Players from '../../../assets/icons/symbols/players.svg?react';
import ArrowRight from '../../../assets/icons/arrows/arrowright.svg?react';

/**
 * «Fast spillkveld»: the club's rhythm in words on the left, and the next game nights as a row
 * of date tokens on the right, the first one orange with «Neste». A themed night (one with its
 * own page or image) carries its name. `signUp` adds a member's toggle under each date.
 */
export function GameNightStrip({
  nights,
  now,
  signUp,
}: {
  nights: CalendarEventTypes[];
  now: Date;
  signUp?: (event: CalendarEventTypes) => ReactNode;
}) {
  const first = nights[0];
  const time = first
    ? `${clockTime(new Date(first.eventStartTime))}–${clockTime(new Date(first.eventEndTime))}`
    : '17:00–23:30';
  const place = first?.location || 'Byhaugkafeen, Stavanger';
  return (
    <section
      aria-labelledby="fast-spillkveld"
      className="bg-cream dark:bg-darkblue border-b border-black dark:border-white/20"
    >
      <div className="max-w-shell mx-auto grid gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-center lg:py-10">
        <div className="text-darkestblue flex flex-col gap-2 dark:text-white">
          <Eyebrow>Fast spillkveld</Eyebrow>
          <h2 id="fast-spillkveld" className="font-heading text-h2 font-extrabold">
            Annenhver torsdag
          </h2>
          <p className="font-body flex items-center gap-2">
            <Clock aria-hidden="true" className="h-4 w-4 flex-none fill-current" /> {time}
          </p>
          <p className="font-body flex items-center gap-2">
            <Pin aria-hidden="true" className="h-4 w-4 flex-none fill-current" /> {place}
          </p>
          <p className="font-body flex items-center gap-2">
            <Players aria-hidden="true" className="h-4 w-4 flex-none fill-current" /> Åpent for
            alle, ingen påmelding
          </p>
        </div>
        <ol className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pt-3 pb-4 sm:mx-0 sm:px-0">
          {nights.map((event, i) => {
            const start = new Date(event.eventStartTime);
            const note = isSpecialEvent(event)
              ? `★ ${event.title}`
              : i === 0
                ? countdownLabel(start, now)
                : '';
            return (
              <li
                key={event._id}
                className={`border-darkestblue relative flex w-28 flex-none snap-start flex-col items-center border-2 px-1 py-3 dark:border-white ${
                  i === 0
                    ? 'bg-orange text-darkestblue shadow-[6px_6px_0_var(--color-darkestblue)] dark:shadow-[6px_6px_0_white]'
                    : 'text-darkestblue dark:bg-darkestblue bg-white dark:text-white'
                }`}
              >
                {i === 0 && (
                  <span className="font-heading bg-darkestblue absolute -top-3 px-2 text-xs font-extrabold tracking-[0.14em] text-white uppercase">
                    Neste
                  </span>
                )}
                <span className="sr-only">{formatDayLong(start, 'nb')}</span>
                <span
                  aria-hidden="true"
                  className="font-heading text-xs font-extrabold tracking-[0.16em] uppercase"
                >
                  {weekdayAbbreviation(start)}
                </span>
                <span aria-hidden="true" className="font-heading text-5xl font-extrabold">
                  {dayOfMonth(start)}
                </span>
                <span
                  aria-hidden="true"
                  className="font-heading text-xs font-extrabold tracking-[0.16em] uppercase"
                >
                  {monthAbbreviation(start)}
                </span>
                <span className="font-body mt-1.5 line-clamp-2 min-h-8 text-center text-xs leading-tight font-bold">
                  {note}
                </span>
                {signUp && <div className="mt-1">{signUp(event)}</div>}
              </li>
            );
          })}
          <li className="flex w-28 flex-none snap-start">
            <Link
              to="/kalender/alle?kategori=spillkveld"
              className="font-heading text-darkestblue border-darkestblue flex w-full flex-col items-center justify-center gap-2 border-2 border-dashed p-3 text-center text-sm font-bold dark:border-white dark:text-white"
            >
              Alle spillkvelder
              <ArrowRight aria-hidden="true" className="h-5 w-5 fill-current" />
            </Link>
          </li>
        </ol>
      </div>
    </section>
  );
}
