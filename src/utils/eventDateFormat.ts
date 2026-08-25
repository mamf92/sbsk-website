// Shared by `CalendarSection` (the list/calendar rows) and `SingleEventPage` (the summary
// card and day-by-day schedule) — both format the same event start/end times the same way.

const LOCALE = 'no-NO';

/** "AUG". Sliced off the long name because the short one carries a trailing period. */
export function monthAbbreviation(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: 'long' }).slice(0, 3).toUpperCase();
}

/** "Man" — likewise stripped of the abbreviating period. */
export function weekdayAbbreviation(date: Date): string {
  const weekday = date.toLocaleDateString(LOCALE, { weekday: 'short' }).replace('.', '');
  return weekday.charAt(0).toUpperCase() + weekday.slice(1);
}

export function clockTime(date: Date): string {
  return date.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit', hour12: false });
}

/** "Man 18:00–22:00", widening to include both dates when the event runs past midnight. */
export function timeRange(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  if (sameDay) {
    return `${weekdayAbbreviation(start)} ${clockTime(start)}–${clockTime(end)}`;
  }

  // Without the year a range that crosses New Year reads as though it runs backwards
  // ("26. feb. – 25. jan."), so it is spelled out only in that case.
  const crossesYears = start.getFullYear() !== end.getFullYear();
  const dayAndMonth = (date: Date) =>
    date.toLocaleDateString(LOCALE, {
      day: 'numeric',
      month: 'short',
      ...(crossesYears ? { year: 'numeric' } : {}),
    });

  return (
    `${weekdayAbbreviation(start)} ${dayAndMonth(start)} ${clockTime(start)} – ` +
    `${weekdayAbbreviation(end)} ${dayAndMonth(end)} ${clockTime(end)}`
  );
}
