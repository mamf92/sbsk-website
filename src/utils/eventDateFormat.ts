// Shared by `CalendarSection` (the list/calendar rows) and `SingleEventPage` (the summary
// card and day-by-day schedule) — both format the same event start/end times the same way.
//
// Every club event happens in Stavanger, so every time is shown in Oslo time whatever zone the
// visitor's device (or a CI runner) is in. Nothing here may call a `Date` getter such as
// `getDate()` or `toDateString()`, which read the runtime zone; go through `TIME_ZONE`.

import type { Locale } from './locale';

const LOCALE = 'no-NO';

/** The zone every event time is shown in. */
export const TIME_ZONE = 'Europe/Oslo';

// One formatter per option set, built once. `toLocale*String` with options builds a new
// `Intl.DateTimeFormat` on every call, and a calendar row calls these about ten times.
const formatters = new Map<string, Intl.DateTimeFormat>();
function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let cached = formatters.get(key);
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, { ...options, timeZone: TIME_ZONE });
    formatters.set(key, cached);
  }
  return cached;
}
function format(date: Date, locale: string, options: Intl.DateTimeFormatOptions): string {
  return formatter(locale, options).format(date);
}

/** "2027-01-29": the Oslo calendar date of an instant. Sorts and compares as a string. */
export function osloDateKey(date: Date): string {
  // Swedish formats dates as ISO `YYYY-MM-DD`, which is why it is used here and nowhere else.
  return format(date, 'sv-SE', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** Whole Oslo calendar days from `from` to `to`, ignoring the time of day. */
export function osloDaysBetween(from: Date, to: Date): number {
  const dayNumber = (date: Date) => Date.parse(`${osloDateKey(date)}T00:00:00Z`) / 86400000;
  return Math.round(dayNumber(to) - dayNumber(from));
}

/** 29, the day of the month in Oslo. */
export function dayOfMonth(date: Date): number {
  return Number(format(date, 'en-GB', { day: 'numeric' }));
}

/** "AUG". Sliced off the long name because the short one carries a trailing period. */
export function monthAbbreviation(date: Date): string {
  return format(date, LOCALE, { month: 'long' }).slice(0, 3).toUpperCase();
}

/** "Man" — likewise stripped of the abbreviating period. */
export function weekdayAbbreviation(date: Date): string {
  const weekday = format(date, LOCALE, { weekday: 'short' }).replace('.', '');
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function clockTime(date: Date): string {
  return format(date, LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "Man 18:00–22:00", widening to include both dates when the event runs past midnight. */
export function timeRange(start: Date, end: Date): string {
  const startKey = osloDateKey(start);
  const endKey = osloDateKey(end);
  if (startKey === endKey) {
    return `${weekdayAbbreviation(start)} ${clockTime(start)}–${clockTime(end)}`;
  }

  // Without the year a range that crosses New Year reads as though it runs backwards
  // ("26. feb. – 25. jan."), so it is spelled out only in that case.
  const crossesYears = startKey.slice(0, 4) !== endKey.slice(0, 4);
  const dayAndMonth = (date: Date) =>
    format(date, LOCALE, {
      day: 'numeric',
      month: 'short',
      ...(crossesYears ? { year: 'numeric' } : {}),
    });

  return (
    `${weekdayAbbreviation(start)} ${dayAndMonth(start)} ${clockTime(start)} – ` +
    `${weekdayAbbreviation(end)} ${dayAndMonth(end)} ${clockTime(end)}`
  );
}

/** "23." for a single day, "23.–26." for a range — the date block's big number. */
export function dayLabel(start: Date, end: Date): string {
  return osloDateKey(start) === osloDateKey(end)
    ? `${dayOfMonth(start)}.`
    : `${dayOfMonth(start)}.–${dayOfMonth(end)}.`;
}

/* -------------------------------------------------------------------------- */
/* Locale-aware formatting for the translated event pages                      */
/* -------------------------------------------------------------------------- */

/** The BCP 47 tag `Intl` date formatting uses for a site locale. */
export function dateLocale(locale: Locale): string {
  return locale === 'en' ? 'en-GB' : 'nb-NO';
}

// With the year: these name dates on pages read months ahead, and across New Year.
const WHEN: Intl.DateTimeFormatOptions = {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

/**
 * A CMS timestamp as a Date, or null when it is missing or does not parse. Intl throws a
 * RangeError on an invalid Date, so every optional CMS time goes through this before display.
 */
export function parseInstant(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** "fredag 29. januar 2027 kl. 18:00" / "Friday 29 January 2027 at 18:00", in Oslo time. */
export function formatDateTime(date: Date, locale: Locale): string {
  return format(date, dateLocale(locale), WHEN);
}

/**
 * "fredag 29. januar 18:00–22:00", or a range across days, in Oslo time. `formatRange` drops
 * whatever the two ends share, so the same call reads well for an evening and for a weekend.
 */
export function formatDateTimeRange(start: Date, end: Date, locale: Locale): string {
  return formatter(dateLocale(locale), WHEN).formatRange(start, end);
}

/** "29.–31. januar 2027" / "29–31 January 2027": the dates only, for the festival page. */
export function formatDateRange(start: Date, end: Date, locale: Locale): string {
  return formatter(dateLocale(locale), {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatRange(start, end);
}

/** "fre. 29." / "Fri 29": a festival day on the day switcher. */
export function formatDayShort(date: Date, locale: Locale): string {
  return format(date, dateLocale(locale), { weekday: 'short', day: 'numeric' });
}

/** "fredag 29. januar" / "Friday 29 January": a festival day's heading. */
export function formatDayLong(date: Date, locale: Locale): string {
  return format(date, dateLocale(locale), { weekday: 'long', day: 'numeric', month: 'long' });
}
