import type {
  FestivalDayTypes,
  FestivalSessionTypes,
  FestivalTypes,
  SessionFormat,
  FestivalCalendarTypes,
} from '../sanity/queryHelpers/festivals';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { TIME_ZONE, formatDayLong, osloDateKey } from './eventDateFormat';
import type { IcsEventInput } from './ics';
import type { Locale } from './locale';
import { pickLocale } from '../i18n/pickLocale';

/* -------------------------------------------------------------------------- */
/* Oslo wall-clock times to instants                                           */
/* -------------------------------------------------------------------------- */

// Built once: a programme of a hundred sessions converts several hundred times per render.
const wallClock = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

/** Minutes Oslo is ahead of UTC at `instant` (60 in winter, 120 in summer). */
function osloOffsetMinutes(instant: Date): number {
  const parts = wallClock.formatToParts(instant);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'));
  return Math.round((asUtc - instant.getTime()) / 60000);
}

/**
 * The instant at which an Oslo wall clock shows `hhmm` on `date` ("YYYY-MM-DD"). Looks the
 * offset up for that date, so it is right on both sides of a summer-time change.
 */
export function osloTime(date: string, hhmm: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = hhmm.split(':').map(Number);
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  // Two passes: the offset at the first guess may differ from the offset at the answer.
  let instant = guess - osloOffsetMinutes(new Date(guess)) * 60000;
  instant = guess - osloOffsetMinutes(new Date(instant)) * 60000;
  return new Date(instant);
}

/** "2027-01-30" for "2027-01-29": the next calendar date, independent of any zone. */
function nextDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + 1)).toISOString().slice(0, 10);
}

/**
 * A start and end wall-clock time on `date` as instants. An end at or before the start runs
 * past midnight («22:00–02:00»), so it lands on the next day rather than before the start.
 */
function span(date: string, start: string, end: string): { start: Date; end: Date } {
  const from = osloTime(date, start);
  let to = osloTime(date, end);
  if (to.getTime() <= from.getTime()) to = osloTime(nextDate(date), end);
  return { start: from, end: to };
}

export function sessionDateTimes(
  day: Pick<FestivalDayTypes, 'date'>,
  session: Pick<FestivalSessionTypes, 'start' | 'end'>,
): { start: Date; end: Date } {
  return span(day.date, session.start, session.end);
}

/** The day's opening hours as instants, when both are set. */
export function dayDateTimes(day: FestivalDayTypes): { start: Date; end: Date } | null {
  if (!day.opens || !day.closes) return null;
  return span(day.date, day.opens, day.closes);
}

/* -------------------------------------------------------------------------- */
/* Programme helpers                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The day to open on: the one whose doors are open now (a night that runs past midnight still
 * counts as its own day), else today by the Oslo date, else the first day.
 */
export function defaultDayIndex(festival: Pick<FestivalTypes, 'days'>, now: Date): number {
  const days = festival.days ?? [];
  const time = now.getTime();
  const open = days.findIndex((day) => {
    const hours = dayDateTimes(day);
    return !!hours && hours.start.getTime() <= time && time < hours.end.getTime();
  });
  if (open !== -1) return open;
  const today = osloDateKey(now);
  const index = days.findIndex((day) => day.date === today);
  return index === -1 ? 0 : index;
}

/**
 * Which sessions are on now, and which one starts next, for the «Nå / Neste» markers. Only
 * meaningful while the day runs: before it opens and after its last session both are empty, and
 * a session past midnight still counts.
 */
export function nowAndNext(
  day: FestivalDayTypes,
  now: Date,
): { nowKeys: string[]; nextKey?: string } {
  const time = now.getTime();
  const hours = dayDateTimes(day);
  // Before the doors open, nothing is "next" yet: the day has not started.
  if (hours && time < hours.start.getTime()) return { nowKeys: [] };
  if (!hours && day.date !== osloDateKey(now)) return { nowKeys: [] };
  const sessions = (day.sessions ?? [])
    .filter((session) => session.start && session.end)
    .map((session) => ({ session, ...sessionDateTimes(day, session) }));
  const nowKeys = sessions
    .filter(({ start, end }) => start.getTime() <= time && time < end.getTime())
    .map(({ session }) => session._key);
  const upcoming = sessions
    .filter(({ start }) => start.getTime() > time)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  return { nowKeys, nextKey: upcoming[0]?.session._key };
}

/**
 * Sessions grouped under their start time, in time order, rooms sorted within a group. The
 * room order lives here (Norwegian collation, so «Øvre sal» sorts last), not in the query.
 */
export function groupByStart(
  sessions: FestivalSessionTypes[],
): { start: string; sessions: FestivalSessionTypes[] }[] {
  const groups = new Map<string, FestivalSessionTypes[]>();
  const sorted = [...sessions]
    .filter((session) => session.start)
    .sort(
      (a, b) => a.start.localeCompare(b.start) || (a.room ?? '').localeCompare(b.room ?? '', 'nb'),
    );
  for (const session of sorted) {
    const group = groups.get(session.start);
    if (group) group.push(session);
    else groups.set(session.start, [session]);
  }
  return [...groups].map(([start, list]) => ({ start, sessions: list }));
}

/* -------------------------------------------------------------------------- */
/* Identifiers shared with the members and Vipps phases                        */
/* -------------------------------------------------------------------------- */

/**
 * Where a sign-up inside a festival points: `{dayKey}` for a whole day, `{dayKey}/{sessionKey}`
 * for one session. Sanity keys are only unique within one array, so a bare session key could
 * repeat across days; the path cannot. Used as `event_registrations.session_id`.
 */
export function festivalScopeId(dayKey: string, sessionKey?: string): string {
  if (!dayKey || dayKey.includes('/') || sessionKey?.includes('/')) {
    throw new Error('Sanity keys never contain "/"');
  }
  return sessionKey ? `${dayKey}/${sessionKey}` : dayKey;
}

export function parseFestivalScopeId(
  scopeId: string | null,
): { dayKey: string; sessionKey?: string } | null {
  if (!scopeId) return null;
  const parts = scopeId.split('/');
  if (parts.length > 2 || parts.some((part) => !part)) return null;
  return parts.length === 2 ? { dayKey: parts[0], sessionKey: parts[1] } : { dayKey: parts[0] };
}

/* -------------------------------------------------------------------------- */
/* Calendar export                                                             */
/* -------------------------------------------------------------------------- */

function venueLine(venue: FestivalDayTypes['venue']): string | undefined {
  return [venue?.name, venue?.address].filter(Boolean).join(', ') || undefined;
}

/**
 * Every session of a festival as calendar entries, for the programme's .ics download. A day with
 * no sessions but opening hours becomes one entry for the day. UIDs are built from the Sanity
 * keys, so downloading again after the programme changes updates entries instead of adding them.
 */
export function festivalIcs(
  festival: FestivalTypes,
  locale: Locale,
  url?: string,
): IcsEventInput[] {
  const name = pickLocale(festival.title, locale)?.value ?? 'Board Game Masters';
  const entries: IcsEventInput[] = [];
  for (const day of festival.days ?? []) {
    const location = venueLine(day.venue) ?? venueLine(festival.venue);
    const sessions = (day.sessions ?? []).filter((session) => session.start && session.end);
    if (sessions.length === 0) {
      const hours = dayDateTimes(day);
      if (hours) {
        entries.push({
          ...hours,
          title: name,
          location,
          url,
          uid: `${festival._id}-${day._key}`,
        });
      }
      continue;
    }
    for (const session of sessions) {
      const title = pickLocale(session.title, locale)?.value ?? session.game?.name;
      entries.push({
        ...sessionDateTimes(day, session),
        title: title ? `${title} · ${name}` : name,
        description: pickLocale(session.description, locale)?.value,
        location:
          session.room && location ? `${session.room}, ${location}` : (session.room ?? location),
        url,
        uid: `${festival._id}-${day._key}-${session._key}`,
      });
    }
  }
  return entries;
}

/** Midday on a festival date, as an instant: safe to format as that date in Oslo. */
export function festivalDate(date: string): Date {
  return osloTime(date, '12:00');
}

/** The formats present on a day, in the order the Studio lists them. */
export function formatsOf(sessions: FestivalSessionTypes[]): SessionFormat[] {
  const present = new Set(sessions.map((session) => session.format).filter(Boolean));
  return SESSION_FORMAT_ORDER.filter((format) => present.has(format));
}

const SESSION_FORMAT_ORDER: SessionFormat[] = [
  'turnering',
  'finale',
  'laer-a-spille',
  'fri-spilling',
  'demo',
  'pause',
  'annet',
];

/**
 * A festival as calendar rows, one per day, linking to that day of the programme. The calendar
 * is Norwegian, so titles are too: «Board Game Masters – fredag 29. januar».
 */
export function festivalDayRows(festival: FestivalCalendarTypes): CalendarEventTypes[] {
  const name = festival.title?.nb?.trim() || 'Storarrangement';
  return (festival.days ?? [])
    .filter((day) => /^\d{4}-\d{2}-\d{2}$/.test(day.date ?? ''))
    .map((day, index) => {
      const hours = dayDateTimes(day as FestivalDayTypes) ?? {
        start: osloTime(day.date, '00:00'),
        end: osloTime(day.date, '23:59'),
      };
      const label = day.label?.nb?.trim();
      return {
        _id: `${festival._id}:${day._key}`,
        title: `${name} – ${label || formatDayLong(festivalDate(day.date), 'nb')}`,
        eventStartTime: hours.start,
        eventEndTime: hours.end,
        category: 'turnering',
        location: festival.venue?.name,
        hasDetailPage: true,
        detailPath: `/arrangementer/${festival.slug}?dag=${index + 1}`,
      };
    });
}
