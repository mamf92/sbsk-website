import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { CalendarEventTypes } from '../../../sanity/queryHelpers/events';
import { Button } from '../../ui/Buttons';
import { IconButton } from '../../ui/IconButton';
import { clockTime } from '../../../utils/eventDateFormat';
import { eventDetailPath } from '../../../utils/eventLinks';
import {
  MONTHS,
  WEEKDAYS,
  WEEKDAYS_LONG,
  eventsByDay,
  monthTitle,
  monthWeeks,
} from '../../../utils/monthGrid';
import { EVENT_CATEGORY, eventCategory } from './eventStyles';

/** A lettered square (S/T/A) for a phone's month grid, where no name fits in a cell. */
function LetterSquare({ category }: { category: CalendarEventTypes['category'] }) {
  const cat = eventCategory(category);
  return (
    <span
      aria-hidden="true"
      className={`font-heading inline-flex size-4 flex-none items-center justify-center text-[10px] leading-none font-extrabold dark:outline dark:outline-white/60 ${cat.chip}`}
    >
      {cat.letter}
    </span>
  );
}

/** What the letters and colours on the month grid mean. */
export function Legend() {
  return (
    <div className="font-body text-darkestblue flex flex-wrap items-center justify-between gap-x-5 gap-y-2 text-sm dark:text-white">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {(Object.keys(EVENT_CATEGORY) as CalendarEventTypes['category'][]).map((key) => (
          <span key={key} className="inline-flex items-center gap-1.5">
            <LetterSquare category={key} />
            {EVENT_CATEGORY[key].label}
          </span>
        ))}
      </div>
      <span className="text-xs opacity-80">Trykk på en dag for å se hva som skjer.</span>
    </div>
  );
}

/**
 * A month as a Monday-first grid. On desktop each day shows its events' names and start times
 * on their category colour; on a phone, lettered squares. A day with events is a button that
 * picks it; the page lists the picked day's events under the grid. On desktop, an event with a
 * page of its own is also a link straight to that page, laid over the day's button.
 */
export function MonthGrid({
  year,
  month,
  events,
  todayKey,
  selectedKey,
  onSelect,
  onMonth,
  onToday,
}: {
  year: number;
  /** 0–11. */
  month: number;
  events: CalendarEventTypes[];
  todayKey: string;
  selectedKey?: string;
  onSelect: (dayKey: string | null) => void;
  onMonth: (delta: number) => void;
  onToday: () => void;
}) {
  const byDay = useMemo(() => eventsByDay(events), [events]);
  const weeks = monthWeeks(year, month);
  return (
    <div className="text-darkestblue dark:bg-darkestblue w-full border border-black bg-white dark:border-white dark:text-white">
      <div className="bg-darkblue surface-dark flex items-center gap-2 p-2 text-white">
        <IconButton
          icon="arrowLeft"
          label="Forrige måned"
          size="sm"
          className="text-white"
          onClick={() => onMonth(-1)}
        />
        <h2
          aria-live="polite"
          className="font-heading tracking-heading sm:text-h3 min-w-0 flex-1 text-center text-base font-bold"
        >
          {monthTitle(year, month)}
        </h2>
        <Button variant="primary" size="xs" onClick={onToday}>
          I dag
        </Button>
        <IconButton
          icon="arrowRight"
          label="Neste måned"
          size="sm"
          className="text-white"
          onClick={() => onMonth(1)}
        />
      </div>

      <div
        aria-hidden="true"
        className="dark:bg-darkblue grid grid-cols-7 border-b border-black bg-gray-100 dark:border-white"
      >
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="font-heading py-1.5 text-center text-xs font-bold tracking-[0.14em] uppercase"
          >
            {weekday}
          </div>
        ))}
      </div>

      <ol className="grid grid-cols-7">
        {weeks.flat().map((day, index) => {
          const dayEvents = byDay.get(day.key) ?? [];
          const outside = day.m !== month;
          const isToday = day.key === todayKey;
          const isPast = day.key < todayKey;
          const selected = day.key === selectedKey;
          const label = `${WEEKDAYS_LONG[day.weekday]} ${day.d}. ${MONTHS[day.m]}${
            isToday ? ', i dag' : ''
          }: ${dayEvents.map((event) => event.title).join(', ')}`;
          const cell =
            'relative flex h-full w-full flex-col items-center gap-1 p-1 text-left min-h-16 sm:min-h-28 sm:items-stretch sm:p-1.5';
          const selectedClasses = selected
            ? 'outline-darkorange dark:outline-orange dark:bg-darkblue bg-gray-100 outline-2 -outline-offset-2'
            : '';
          const content = (
            <>
              <span
                className={`font-heading inline-flex h-6 min-w-6 items-center justify-center px-1 text-sm font-bold sm:self-start ${
                  isToday
                    ? 'bg-orange text-darkestblue'
                    : outside || isPast
                      ? 'font-normal text-gray-600 dark:text-white/70'
                      : ''
                }`}
              >
                {day.d}
              </span>
              {dayEvents.length > 0 && (
                <>
                  <span className="hidden min-w-0 flex-col gap-1 sm:flex">
                    {dayEvents.slice(0, 2).map((event) => {
                      const chip = `font-body line-clamp-2 px-1 py-0.5 text-xs leading-tight font-bold break-words hyphens-auto dark:outline dark:outline-white/50 ${
                        eventCategory(event.category).chip
                      }`;
                      const text = (
                        <>
                          {!event.allDay && (
                            <span className="font-normal opacity-85">
                              {clockTime(new Date(event.eventStartTime))}{' '}
                            </span>
                          )}
                          {event.title}
                        </>
                      );
                      const path = eventDetailPath(event);
                      return path ? (
                        <Link
                          key={event._id}
                          to={path}
                          lang="nb"
                          aria-label={`Gå til ${event.title}`}
                          className={`${chip} lift focus-visible:outline-focus-ring pointer-events-auto underline-offset-2 hover:underline focus-visible:outline-2`}
                        >
                          {text}
                        </Link>
                      ) : (
                        <span key={event._id} lang="nb" className={chip}>
                          {text}
                        </span>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <span className="font-body text-xs font-bold opacity-80">
                        +{dayEvents.length - 2} til
                      </span>
                    )}
                  </span>
                  <span className="flex flex-wrap justify-center gap-0.5 sm:hidden">
                    {dayEvents.slice(0, 3).map((event) => (
                      <LetterSquare key={event._id} category={event.category} />
                    ))}
                  </span>
                </>
              )}
            </>
          );
          return (
            <li
              key={day.key}
              className={[
                'relative',
                index % 7 ? 'border-l border-gray-300 dark:border-white/20' : '',
                index >= 7 ? 'border-t border-gray-300 dark:border-white/20' : '',
              ].join(' ')}
            >
              {dayEvents.length > 0 ? (
                <>
                  {/* A raw button on purpose: a grid cell is not one of `Button`'s variants, and
                      takes the cell's whole area as its target. It sits under the cell's
                      content rather than wrapping it, so an event's own link can sit on top
                      without nesting one control in another. */}
                  <button
                    type="button"
                    aria-label={label}
                    aria-pressed={selected}
                    onClick={() => onSelect(selected ? null : day.key)}
                    className={`dark:hover:bg-darkblue absolute inset-0 cursor-pointer hover:bg-gray-100 ${selectedClasses}`}
                  />
                  <div className={`${cell} pointer-events-none`}>{content}</div>
                </>
              ) : (
                // Empty days are left to sight: the list under the grid names every event.
                <div aria-hidden="true" className={cell}>
                  {content}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
