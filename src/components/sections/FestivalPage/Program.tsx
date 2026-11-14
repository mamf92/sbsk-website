import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../ui/Buttons';
import { Chip } from '../../ui/Chip';
import EmptyState from '../../ui/EmptyState';
import { Segmented } from '../../ui/Segmented';
import { SessionCard } from '../../ui/SessionCard';
import { useEventsT } from '../../../i18n';
import { useLocale } from '../../../hooks/locale/useLocale';
import type { FestivalTypes, SessionFormat } from '../../../sanity/queryHelpers/festivals';
import { formatDayShort } from '../../../utils/eventDateFormat';
import {
  defaultDayIndex,
  festivalDate,
  festivalIcs,
  formatsOf,
  groupByStart,
  nowAndNext,
  scheduledSessions,
  sessionDateTimes,
} from '../../../utils/festival';
import { downloadIcs } from '../../../utils/ics';

/** `?dag=2` is the second day, counted from 1 so the URL reads like the page. */
export const DAY_PARAM = 'dag';

const NO_FORMATS: ReadonlySet<SessionFormat> = new Set();

/** A clock that ticks once a minute, for the «Nå / Neste» markers. */
function useMinuteClock(): Date {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/**
 * The programme: a day switcher kept in `?dag=N`, a format filter, and the day's sessions under
 * their start times. Everything a visitor can change lives in the URL or resets with the day, so
 * a shared link opens on the same day.
 */
export function Program({ festival }: { festival: FestivalTypes }) {
  const t = useEventsT();
  const { locale } = useLocale();
  const now = useMinuteClock();
  const [searchParams, setSearchParams] = useSearchParams();
  const days = festival.days ?? [];

  // Chosen once: a page left open past midnight must not switch day (and drop the filter) on
  // its own. The minute clock only moves the «Nå / Neste» markers.
  const [initialDay] = React.useState(() => defaultDayIndex(festival, new Date()));
  const requested = Number(searchParams.get(DAY_PARAM));
  const dayIndex =
    Number.isInteger(requested) && requested >= 1 && requested <= days.length
      ? requested - 1
      : initialDay;
  const day = days[dayIndex];

  // A filter chosen for one day means nothing on the next, so it is stored with its day.
  const [filter, setFilter] = React.useState<{ day: number; formats: ReadonlySet<SessionFormat> }>({
    day: dayIndex,
    formats: new Set(),
  });
  const formats = filter.day === dayIndex ? filter.formats : NO_FORMATS;
  const setFormats = (next: ReadonlySet<SessionFormat>) =>
    setFilter({ day: dayIndex, formats: next });

  if (!day) return null;

  const sessions = scheduledSessions(day);
  const available = formatsOf(sessions);
  const shown =
    formats.size === 0
      ? sessions
      : sessions.filter((session) => session.format && formats.has(session.format));
  const groups = groupByStart(shown);
  const { nowKeys, nextKey } = nowAndNext(day, now);
  const sponsorByName = new Map((festival.sponsors ?? []).map((s) => [s.altText, s]));
  // Before the programme is out there is nothing to print. The calendar file is always there:
  // `festivalIcs` gives every day an entry, all day when only its date is known.
  const hasProgramme = days.some((d) => scheduledSessions(d).length > 0);

  const chooseDay = (value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(DAY_PARAM, String(Number(value) + 1));
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };

  const toggleFormat = (format: SessionFormat) => {
    const next = new Set(formats);
    if (next.has(format)) next.delete(format);
    else next.add(format);
    setFormats(next);
  };

  return (
    <section
      id="program"
      aria-labelledby="program-heading"
      className="flex scroll-mt-4 flex-col gap-6"
    >
      <h2 id="program-heading" className="font-heading text-h2 font-bold">
        {t('program.title')}
      </h2>

      <div className="flex flex-col gap-4 print:hidden">
        {days.length > 1 && (
          <Segmented
            label={t('program.chooseDay')}
            value={String(dayIndex)}
            onChange={chooseDay}
            options={days.map((d, index) => ({
              value: String(index),
              label: formatDayShort(festivalDate(d.date), locale),
            }))}
            className="flex-wrap"
          />
        )}

        {available.length > 1 && (
          <div role="group" aria-label={t('program.filterLabel')} className="flex flex-wrap gap-2">
            {available.map((format) => (
              <Chip
                key={format}
                active={formats.has(format)}
                onClick={() => toggleFormat(format)}
                // Chip capitalises every word for its one-word category labels; formats are
                // phrases («Lær å spille»), written in sentence case.
                className="normal-case"
              >
                {t(`format.${format}`)}
              </Chip>
            ))}
            {formats.size > 0 && (
              <Button variant="tertiary" size="xs" onClick={() => setFormats(new Set())}>
                {t('program.reset')}
              </Button>
            )}
          </div>
        )}

        <p role="status" className="font-body text-sm">
          {sessions.length > 0 &&
            t('program.showing', { shown: shown.length, total: sessions.length })}
        </p>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon="add"
            onClick={() =>
              downloadIcs(
                festivalIcs(festival, locale, window.location.href),
                `${festival.slug}.ics`,
              )
            }
          >
            {t('program.addToCalendar')}
          </Button>
          {hasProgramme && (
            <Button variant="tertiary" size="sm" onClick={() => window.print()}>
              {t('program.print')}
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-6 print:hidden">
        {sessions.length === 0 ? (
          <EmptyState variant="inline" headingLevel={3} title={t('program.emptyDay')} />
        ) : (
          groups.map((group) => (
            <section key={group.start} className="flex flex-col gap-3">
              <h3 className="font-heading text-h3 font-bold">{group.start}</h3>
              {group.sessions.map((session) => {
                const { start, end } = sessionDateTimes(day, session);
                const status = nowKeys.includes(session._key)
                  ? 'now'
                  : session._key === nextKey
                    ? 'next'
                    : undefined;
                return (
                  <SessionCard
                    key={session._key}
                    session={session}
                    start={start}
                    end={end}
                    status={status}
                    now={now}
                    sponsor={session.sponsor ? sponsorByName.get(session.sponsor) : undefined}
                  />
                );
              })}
            </section>
          ))
        )}
      </div>
    </section>
  );
}
