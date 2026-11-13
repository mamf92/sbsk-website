// Shared by `CalendarSection` (the list/calendar rows) and `SingleEventPage` (the summary
// card and day-by-day schedule) — both format the same event start/end times the same way.
//
// Every club event happens in Stavanger, so every time is shown in Oslo time whatever zone the
// visitor's device (or a CI runner) is in. Nothing here may call a `Date` getter such as
// `getDate()` or `toDateString()`, which read the runtime zone; go through `TIME_ZONE`.

const LOCALE = 'no-NO';

/** The zone every event time is shown in. */
export const TIME_ZONE = 'Europe/Oslo';

/** "2027-01-29": the Oslo calendar date of an instant. Sorts and compares as a string. */
export function osloDateKey(date: Date): string {
  // Swedish formats dates as ISO `YYYY-MM-DD`, which is why it is used here and nowhere else.
  return date.toLocaleDateString('sv-SE', { timeZone: TIME_ZONE });
}

/** Whole Oslo calendar days from `from` to `to`, ignoring the time of day. */
export function osloDaysBetween(from: Date, to: Date): number {
  const dayNumber = (date: Date) => Date.parse(`${osloDateKey(date)}T00:00:00Z`) / 86400000;
  return Math.round(dayNumber(to) - dayNumber(from));
}

/** 29, the day of the month in Oslo. */
export function dayOfMonth(date: Date): number {
  return Number(date.toLocaleDateString('en-GB', { day: 'numeric', timeZone: TIME_ZONE }));
}

/** "AUG". Sliced off the long name because the short one carries a trailing period. */
export function monthAbbreviation(date: Date): string {
  return date
    .toLocaleDateString(LOCALE, { month: 'long', timeZone: TIME_ZONE })
    .slice(0, 3)
    .toUpperCase();
}

/** "Man" — likewise stripped of the abbreviating period. */
export function weekdayAbbreviation(date: Date): string {
  const weekday = date
    .toLocaleDateString(LOCALE, { weekday: 'short', timeZone: TIME_ZONE })
    .replace('.', '');
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function clockTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TIME_ZONE,
  });
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
    date.toLocaleDateString(LOCALE, {
      day: 'numeric',
      month: 'short',
      timeZone: TIME_ZONE,
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
