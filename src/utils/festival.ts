import type {
  FestivalDayTypes,
  FestivalSessionTypes,
  FestivalTypes,
} from '../sanity/queryHelpers/festivals';
import { TIME_ZONE, osloDateKey } from './eventDateFormat';

/* -------------------------------------------------------------------------- */
/* Oslo wall-clock times to instants                                           */
/* -------------------------------------------------------------------------- */

/** Minutes Oslo is ahead of UTC at `instant` (60 in winter, 120 in summer). */
function osloOffsetMinutes(instant: Date): number {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(instant);
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

export function sessionDateTimes(
  day: Pick<FestivalDayTypes, 'date'>,
  session: Pick<FestivalSessionTypes, 'start' | 'end'>,
): { start: Date; end: Date } {
  return { start: osloTime(day.date, session.start), end: osloTime(day.date, session.end) };
}

/** The day's opening hours as instants, when both are set. */
export function dayDateTimes(day: FestivalDayTypes): { start: Date; end: Date } | null {
  if (!day.opens || !day.closes) return null;
  return { start: osloTime(day.date, day.opens), end: osloTime(day.date, day.closes) };
}

/* -------------------------------------------------------------------------- */
/* Programme helpers                                                           */
/* -------------------------------------------------------------------------- */

/** Today's index while the festival runs (Oslo date), else the first day. */
export function defaultDayIndex(festival: Pick<FestivalTypes, 'days'>, now: Date): number {
  const today = osloDateKey(now);
  const index = (festival.days ?? []).findIndex((day) => day.date === today);
  return index === -1 ? 0 : index;
}

/**
 * Which sessions are on now, and which one starts next, for the «Nå / Neste» markers. Only
 * meaningful on the day itself; on any other day both are empty.
 */
export function nowAndNext(
  day: FestivalDayTypes,
  now: Date,
): { nowKeys: string[]; nextKey?: string } {
  if (day.date !== osloDateKey(now)) return { nowKeys: [] };
  const time = now.getTime();
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

/** Sessions grouped under their start time, in time order, rooms sorted within a group. */
export function groupByStart(
  sessions: FestivalSessionTypes[],
): { start: string; sessions: FestivalSessionTypes[] }[] {
  const groups = new Map<string, FestivalSessionTypes[]>();
  const sorted = [...sessions]
    .filter((session) => session.start)
    .sort(
      (a, b) =>
        a.start.localeCompare(b.start) || (a.room ?? '').localeCompare(b.room ?? '', 'nb'),
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
