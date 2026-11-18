import type { AdminEvent } from '../../../sanity/queryHelpers/admin-events';

const dateTime = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Oslo',
});
const dateOnly = new Intl.DateTimeFormat('nb-NO', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Europe/Oslo',
});

/** "tor. 20. nov., 17:00" for an event; "fre. 20. nov. – søn. 22. nov." for a festival. */
export function formatAdminEventDate(event: AdminEvent): string {
  if (event._type === 'festival') {
    const start = dateOnly.format(new Date(`${event.start}T12:00:00Z`));
    const end = dateOnly.format(new Date(`${event.end}T12:00:00Z`));
    return start === end ? start : `${start} – ${end}`;
  }
  return dateTime.format(new Date(event.start));
}

/** The event's date as yyyy-mm-dd in Oslo, for the attendance snapshot. */
export function osloDate(event: AdminEvent): string {
  if (event._type === 'festival') return event.start.slice(0, 10);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Oslo' }).format(
    new Date(event.start),
  );
}
