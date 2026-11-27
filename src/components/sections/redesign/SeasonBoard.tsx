import { Link } from 'react-router-dom';
import type { CalendarEventTypes } from '../../../sanity/queryHelpers/events';
import { SectionHeading } from '../../ui/SectionHeading';
import { midMonth, seasonTickets, type SeasonMonth } from '../../../utils/season';
import { formatDayLong, osloDateKey } from '../../../utils/eventDateFormat';
import { eventCategory } from './eventStyles';
import Meeple from '../../../assets/icons/symbols/meeple.svg?react';
import Check from '../../../assets/icons/symbols/check.svg?react';

const MONTH_NAME = new Intl.DateTimeFormat('nb-NO', { month: 'long', timeZone: 'Europe/Oslo' });
const MONTH_SHORT = (date: Date) => MONTH_NAME.format(date).slice(0, 3);

/**
 * «Sesongen på ett brett»: the coming months as spaces on a dashed track, a meeple on this
 * month, and each month's events as small coloured tickets under its space. A ticket opens that
 * day in the month view. On a phone the board scrolls sideways rather than squeezing.
 */
export function SeasonBoard({
  months,
  isMine,
}: {
  months: SeasonMonth[];
  isMine?: (event: CalendarEventTypes) => boolean;
}) {
  const thisYear = months[0]?.year;
  return (
    <section
      aria-labelledby="sesongen"
      className="max-w-shell mx-auto flex flex-col gap-6 px-4 pt-10 sm:px-6 lg:pt-12"
    >
      <SectionHeading id="sesongen" kicker="Oversikt" title="Sesongen på ett brett" />
      <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        <div className="relative min-w-[56rem] pt-9">
          <div
            aria-hidden="true"
            className="border-darkestblue absolute top-[3.625rem] right-[6%] left-[6%] border-t-4 border-dashed dark:border-white/60"
          />
          <ol className="relative grid grid-cols-8">
            {months.map((month, i) => {
              const name = MONTH_NAME.format(midMonth(month.year, month.month));
              const tickets = seasonTickets(month.events);
              const shown = tickets.slice(0, 4);
              return (
                <li key={month.key} className="flex flex-col items-center gap-3 px-1.5">
                  <h3 className="sr-only">
                    {name} {month.year}
                    {i === 0 ? ', denne måneden' : ''}
                  </h3>
                  <span
                    aria-hidden="true"
                    className={`font-heading border-darkestblue relative flex size-11 items-center justify-center border-2 text-sm font-extrabold uppercase dark:border-white ${
                      i === 0
                        ? 'bg-orange text-darkestblue'
                        : 'text-darkestblue dark:bg-darkestblue bg-white dark:text-white'
                    }`}
                  >
                    {MONTH_SHORT(midMonth(month.year, month.month))}
                    {i === 0 && (
                      <Meeple className="text-darkestblue absolute -top-8 h-7 w-7 fill-current dark:text-white" />
                    )}
                  </span>
                  <span
                    aria-hidden="true"
                    className="font-heading text-darkestblue/70 min-h-4 text-xs font-bold dark:text-white/70"
                  >
                    {i === 0
                      ? 'Du er her'
                      : month.year !== thisYear && month.month === 0
                        ? month.year
                        : ''}
                  </span>
                  {month.events.length === 0 ? (
                    <p className="font-body text-darkestblue/60 text-center text-xs dark:text-white/60">
                      <span aria-hidden="true">–</span>
                      <span className="sr-only">Ingen arrangementer ennå</span>
                    </p>
                  ) : (
                    <ul className="flex w-full flex-col gap-1.5">
                      {shown.map(({ key, event, title, days }) => {
                        const start = new Date(event.eventStartTime);
                        const day = osloDateKey(start);
                        const mine = isMine?.(event) ?? false;
                        return (
                          <li key={key}>
                            <Link
                              to={`/kalender/alle?visning=maned&maned=${month.key}&dag=${day.slice(8)}`}
                              className={`font-body lift flex items-start gap-1.5 px-1.5 py-1 text-xs leading-tight font-bold ${
                                eventCategory(event.category).chip
                              } ${mine ? 'outline-success outline-3' : 'dark:outline dark:outline-white/50'}`}
                            >
                              <span className="sr-only">{formatDayLong(start, 'nb')}: </span>
                              <span aria-hidden="true" className="flex-none opacity-80">
                                {days}
                              </span>
                              <span className="line-clamp-2 min-w-0">{title}</span>
                              {mine && (
                                <>
                                  <Check
                                    aria-hidden="true"
                                    className="ml-auto h-3.5 w-3.5 flex-none fill-current"
                                  />
                                  <span className="sr-only"> (du kommer)</span>
                                </>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                      {tickets.length > shown.length && (
                        <li className="font-body text-darkestblue text-center text-xs font-bold dark:text-white">
                          <Link
                            to={`/kalender/alle?visning=maned&maned=${month.key}`}
                            className="underline underline-offset-4"
                          >
                            +{tickets.length - shown.length} til
                          </Link>
                        </li>
                      )}
                    </ul>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}
