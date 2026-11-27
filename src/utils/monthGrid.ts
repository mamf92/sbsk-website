import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { osloDateKey } from './eventDateFormat';

/** The month grid's dates as plain y/m/d, keyed like `osloDateKey` ("2027-01-29"). */
export interface Day {
  y: number;
  /** 0–11. */
  m: number;
  d: number;
  key: string;
  /** 0 = Monday. */
  weekday: number;
}

export const WEEKDAYS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
export const WEEKDAYS_LONG = [
  'mandag',
  'tirsdag',
  'onsdag',
  'torsdag',
  'fredag',
  'lørdag',
  'søndag',
];
export const MONTHS = [
  'januar',
  'februar',
  'mars',
  'april',
  'mai',
  'juni',
  'juli',
  'august',
  'september',
  'oktober',
  'november',
  'desember',
];

/** Normalises overflow, so `makeDay(2027, 0, 0)` is 31 December 2026. */
export function makeDay(y: number, m: number, d: number): Day {
  const date = new Date(Date.UTC(y, m, d));
  return {
    y: date.getUTCFullYear(),
    m: date.getUTCMonth(),
    d: date.getUTCDate(),
    key: date.toISOString().slice(0, 10),
    weekday: (date.getUTCDay() + 6) % 7,
  };
}

/** The Oslo calendar day `now` falls on. */
export function osloDay(now: Date): Day {
  const [y, m, d] = osloDateKey(now).split('-').map(Number);
  return makeDay(y, m - 1, d);
}

/** "2027-01-29" → that day, or null for anything that is not a real date. */
export function parseDayKey(key: string | null): Day | null {
  if (!key || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return null;
  const [y, m, d] = key.split('-').map(Number);
  const day = makeDay(y, m - 1, d);
  return day.key === key ? day : null;
}

/** "2027-01" → { y: 2027, m: 0 }, or null. */
export function parseMonthKey(key: string | null): { y: number; m: number } | null {
  if (!key || !/^\d{4}-\d{2}$/.test(key)) return null;
  const [y, m] = key.split('-').map(Number);
  return m >= 1 && m <= 12 ? { y, m: m - 1 } : null;
}

export function monthKey(y: number, m: number): string {
  const day = makeDay(y, m, 1);
  return day.key.slice(0, 7);
}

/** «Januar 2027». */
export function monthTitle(y: number, m: number): string {
  return `${MONTHS[m].charAt(0).toUpperCase()}${MONTHS[m].slice(1)} ${y}`;
}

/** Monday-first weeks covering the month, with the neighbouring months' days filling the ends. */
export function monthWeeks(y: number, m: number): Day[][] {
  const first = makeDay(y, m, 1);
  const last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const weeks: Day[][] = [];
  for (let cursor = 1 - first.weekday; cursor <= last; cursor += 7) {
    weeks.push(Array.from({ length: 7 }, (_, i) => makeDay(y, m, cursor + i)));
  }
  return weeks;
}

/** Events by the Oslo day they start on. */
export function eventsByDay(events: CalendarEventTypes[]): Map<string, CalendarEventTypes[]> {
  const map = new Map<string, CalendarEventTypes[]>();
  for (const event of events) {
    const key = osloDateKey(new Date(event.eventStartTime));
    map.set(key, [...(map.get(key) ?? []), event]);
  }
  return map;
}
