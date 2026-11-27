import * as React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '../../ui/Buttons';
import { Chip } from '../../ui/Chip';
import { Eyebrow } from '../../ui/Eyebrow';
import { SectionHeading } from '../../ui/SectionHeading';
import { SessionCard } from '../../ui/SessionCard';
import { SignupBlock } from '../../ui/SignupBlock';
import { DAY_PARAM } from '../FestivalPage/Program';
import { useEventsT } from '../../../i18n';
import { pickLocale } from '../../../i18n/pickLocale';
import { useLocale } from '../../../hooks/locale/useLocale';
import type { FestivalTypes, SessionFormat } from '../../../sanity/queryHelpers/festivals';
import {
  dayOfMonth,
  formatDayLong,
  monthAbbreviation,
  weekdayAbbreviation,
} from '../../../utils/eventDateFormat';
import {
  defaultDayIndex,
  festivalDate,
  festivalDayIcs,
  festivalIcs,
  formatsOf,
  nowAndNext,
  scheduledSessions,
  sessionDateTimes,
} from '../../../utils/festival';
import { downloadIcs } from '../../../utils/ics';
import Clock from '../../../assets/icons/symbols/clock.svg?react';
import Pin from '../../../assets/icons/symbols/locationpin.svg?react';

const NO_FORMATS: ReadonlySet<SessionFormat> = new Set();

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** A clock that ticks once a minute, for the «Nå / Neste» markers. */
function useMinuteClock(): Date {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

/** One day as a date token: weekday, big day number, month, and the day's own name. */
function DayToken({
  date,
  label,
  hours,
  active = false,
}: {
  date: Date;
  label: string;
  hours?: string;
  active?: boolean;
}) {
  return (
    <>
      <span className="font-heading text-xs font-extrabold tracking-[0.16em] uppercase">
        {weekdayAbbreviation(date)}
      </span>
      <span className="font-heading text-4xl leading-none font-extrabold">{dayOfMonth(date)}</span>
      <span className="font-heading text-xs font-extrabold tracking-[0.16em] uppercase">
        {monthAbbreviation(date)}
      </span>
      <span className={`font-body mt-1 text-xs leading-tight ${active ? 'font-bold' : ''}`}>
        {label}
      </span>
      {hours && <span className="font-body text-xs">{hours}</span>}
    </>
  );
}

const tokenBase =
  'border-darkestblue flex w-20 flex-none flex-col items-center border-2 px-1 py-3 text-center sm:w-28 dark:border-white';
const tokenIdle = 'text-darkestblue dark:bg-darkestblue bg-white dark:text-white';
const tokenActive =
  'bg-orange text-darkestblue shadow-[6px_6px_0_var(--color-darkestblue)] dark:shadow-[6px_6px_0_white]';

/**
 * The festival's days and programme on the new pages, as ONE block: the days are the switcher,
 * so they are not listed a second time. The chosen day lives in `?dag=N` like today's programme,
 * so a shared link opens on the same day. Before any day has a timed session, the block shrinks
 * to a short band of the days and «Programmet kommer», with no empty panel; once the programme
 * is entered in the Studio it turns into the full view by itself.
 */
export function FestivalProgram({ festival }: { festival: FestivalTypes }) {
  const t = useEventsT();
  const { locale } = useLocale();
  const now = useMinuteClock();
  const [searchParams, setSearchParams] = useSearchParams();
  const days = festival.days ?? [];
  const [initialDay] = React.useState(() => defaultDayIndex(festival, new Date()));
  const requested = Number(searchParams.get(DAY_PARAM));
  const dayIndex =
    Number.isInteger(requested) && requested >= 1 && requested <= days.length
      ? requested - 1
      : initialDay;
  const day = days[dayIndex];
  const [filter, setFilter] = React.useState<{ day: number; formats: ReadonlySet<SessionFormat> }>({
    day: dayIndex,
    formats: new Set(),
  });
  if (!day) return null;

  const title = pickLocale(festival.title, locale)?.value ?? 'Board Game Masters';
  const hasProgramme = days.some((d) => scheduledSessions(d).length > 0);
  const dayLabel = (index: number) =>
    pickLocale(days[index].label, locale)?.value ?? t('festival.dayN', { n: index + 1 });
  const hoursOf = (index: number) =>
    days[index].opens && days[index].closes
      ? `${days[index].opens}–${days[index].closes}`
      : undefined;
  const wholeFestival = () =>
    downloadIcs(festivalIcs(festival, locale, window.location.href), `${festival.slug}.ics`);

  if (!hasProgramme) {
    return (
      <section
        id="program"
        aria-labelledby="program-heading"
        className="bg-cream dark:bg-darkblue scroll-mt-4 border-y border-black dark:border-white/20"
      >
        <div className="max-w-shell text-darkestblue mx-auto grid gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[16rem_minmax(0,1fr)] lg:items-center dark:text-white">
          <div className="flex flex-col gap-2">
            <Eyebrow>{t('program.title')}</Eyebrow>
            <h2 id="program-heading" className="font-heading text-h2 font-extrabold">
              {t('redesign.days', { count: days.length })}
            </h2>
            <p className="font-body">{t('redesign.programmeComing')}</p>
          </div>
          <ol className="flex flex-wrap gap-3 sm:gap-4">
            {days.map((d, index) => (
              <li key={d._key} className={`${tokenBase} ${tokenIdle}`}>
                <DayToken
                  date={festivalDate(d.date)}
                  label={dayLabel(index)}
                  hours={hoursOf(index)}
                />
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  const formats = filter.day === dayIndex ? filter.formats : NO_FORMATS;
  const sessions = scheduledSessions(day);
  const available = formatsOf(sessions);
  const shown =
    formats.size === 0
      ? sessions
      : sessions.filter((session) => session.format && formats.has(session.format));
  const { nowKeys, nextKey } = nowAndNext(day, now);
  const sponsorByName = new Map((festival.sponsors ?? []).map((s) => [s.altText, s]));
  const summary = pickLocale(day.summary, locale);
  const place = day.venue?.name ?? festival.venue?.name;
  const date = festivalDate(day.date);

  const chooseDay = (index: number) => {
    const next = new URLSearchParams(searchParams);
    next.set(DAY_PARAM, String(index + 1));
    setSearchParams(next, { replace: true, preventScrollReset: true });
  };
  const toggleFormat = (format: SessionFormat) => {
    const next = new Set(formats);
    if (next.has(format)) next.delete(format);
    else next.add(format);
    setFilter({ day: dayIndex, formats: next });
  };

  return (
    <section
      id="program"
      aria-labelledby="program-heading"
      className="bg-cream dark:bg-darkblue scroll-mt-4 border-y border-black dark:border-white/20 print:hidden"
    >
      <div className="max-w-shell text-darkestblue mx-auto flex flex-col gap-6 px-4 py-10 sm:px-6 lg:py-12 dark:text-white">
        <SectionHeading
          id="program-heading"
          title={t('program.title')}
          kicker={t('redesign.days', { count: days.length })}
          action={
            <span className="flex flex-wrap gap-x-4">
              <button
                type="button"
                onClick={wholeFestival}
                className="focus-visible:outline-focus-ring underline underline-offset-4 focus-visible:outline-2"
              >
                {t('program.addToCalendar')}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="focus-visible:outline-focus-ring underline underline-offset-4 focus-visible:outline-2"
              >
                {t('program.print')}
              </button>
            </span>
          }
        />

        {days.length > 1 && (
          <div role="group" aria-label={t('redesign.chooseDay')} className="flex gap-3 sm:gap-4">
            {days.map((d, index) => {
              const active = index === dayIndex;
              return (
                <button
                  key={d._key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => chooseDay(index)}
                  className={`${tokenBase} ${active ? tokenActive : tokenIdle} focus-visible:outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2`}
                >
                  <span className="sr-only">{formatDayLong(festivalDate(d.date), locale)}: </span>
                  <span aria-hidden="true" className="contents">
                    <DayToken date={festivalDate(d.date)} label={dayLabel(index)} active={active} />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="dark:bg-darkestblue border border-black bg-white p-5 sm:p-6 dark:border-white/30">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-current pb-3">
            <div className="flex flex-col gap-1">
              <h3 className="font-heading text-h2 font-extrabold">
                {capitalise(formatDayLong(date, locale))}
              </h3>
              <p className="font-body flex flex-wrap gap-x-4 opacity-85">
                {hoursOf(dayIndex) && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock aria-hidden="true" className="h-4 w-4 fill-current" />
                    {hoursOf(dayIndex)}
                  </span>
                )}
                {place && (
                  <span
                    className="inline-flex items-center gap-1.5"
                    lang={locale === 'nb' ? undefined : 'nb'}
                  >
                    <Pin aria-hidden="true" className="h-4 w-4 fill-current" />
                    {place}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SignupBlock signup={day.signup} now={now} compact />
              <Button
                variant="secondary"
                size="sm"
                icon="calendar"
                onClick={() =>
                  downloadIcs(
                    festivalDayIcs(
                      festival,
                      day,
                      `${title} · ${dayLabel(dayIndex)}`,
                      window.location.href,
                    ),
                    `${festival.slug}-${day.date}.ics`,
                  )
                }
              >
                {t('redesign.dayCalendar')}
              </Button>
            </div>
          </div>
          {summary && (
            <p className="font-body pt-3" lang={summary.lang !== locale ? summary.lang : undefined}>
              {summary.value}
            </p>
          )}

          {available.length > 1 && (
            <div
              role="group"
              aria-label={t('program.filterLabel')}
              className="flex flex-wrap gap-2 pt-4"
            >
              {available.map((format) => (
                <Chip
                  key={format}
                  active={formats.has(format)}
                  onClick={() => toggleFormat(format)}
                  className="normal-case"
                >
                  {t(`format.${format}`)}
                </Chip>
              ))}
              {formats.size > 0 && (
                <Button
                  variant="tertiary"
                  size="xs"
                  onClick={() => setFilter({ day: dayIndex, formats: new Set() })}
                >
                  {t('program.reset')}
                </Button>
              )}
            </div>
          )}
          <p role="status" className="sr-only">
            {t('program.showing', { shown: shown.length, total: sessions.length })}
          </p>

          {sessions.length === 0 ? (
            <p className="font-body pt-4">{t('program.emptyDay')}</p>
          ) : (
            <div className="pt-1">
              {shown.map((session) => {
                const { start, end } = sessionDateTimes(day, session);
                return (
                  <SessionCard
                    key={session._key}
                    layout="row"
                    session={session}
                    start={start}
                    end={end}
                    now={now}
                    status={
                      nowKeys.includes(session._key)
                        ? 'now'
                        : session._key === nextKey
                          ? 'next'
                          : undefined
                    }
                    sponsor={session.sponsor ? sponsorByName.get(session.sponsor) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
