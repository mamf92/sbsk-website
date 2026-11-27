import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { osloDateKey } from './eventDateFormat';
import { upcomingEvents } from './eventHighlights';

/** One space on «Sesongen på ett brett»: a calendar month in Oslo and what starts in it. */
export interface SeasonMonth {
  /** "2027-01", also the `maned` value of the month view's URL. */
  key: string;
  year: number;
  /** 0–11. */
  month: number;
  events: CalendarEventTypes[];
}

/**
 * The next `count` Oslo months from the one `now` falls in, each with the events that start in
 * it and have not ended. Empty months stay on the board, so the track keeps an even rhythm.
 */
export function seasonMonths(events: CalendarEventTypes[], now: Date, count = 8): SeasonMonth[] {
  const [year, month] = osloDateKey(now).split('-').map(Number);
  const upcoming = upcomingEvents(events, now);
  return Array.from({ length: count }, (_, i) => {
    const y = year + Math.floor((month - 1 + i) / 12);
    const m = (month - 1 + i) % 12;
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    return {
      key,
      year: y,
      month: m,
      events: upcoming.filter((event) =>
        osloDateKey(new Date(event.eventStartTime)).startsWith(key),
      ),
    };
  });
}

/** Midday on the 15th of a month: an instant that falls in that month in every time zone. */
export function midMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month, 15, 12));
}

/** One ticket on the season board: an event, or a festival's days in that month folded into one. */
export interface SeasonTicket {
  key: string;
  event: CalendarEventTypes;
  title: string;
  /** "28." or "28.–31." */
  days: string;
}

export function seasonTickets(events: CalendarEventTypes[]): SeasonTicket[] {
  const tickets: SeasonTicket[] = [];
  const festivals = new Map<string, { ticket: SeasonTicket; first: number; last: number }>();
  const day = (event: CalendarEventTypes) =>
    Number(osloDateKey(new Date(event.eventStartTime)).slice(8));
  for (const event of events) {
    const slug = event.festivalDay ? event.festival?.slug : undefined;
    if (slug) {
      const seen = festivals.get(slug);
      if (seen) {
        seen.last = day(event);
        seen.ticket.days = `${seen.first}.–${seen.last}.`;
        continue;
      }
      const ticket = {
        key: `festival:${slug}`,
        event,
        title: event.festival?.name ?? event.title,
        days: `${day(event)}.`,
      };
      festivals.set(slug, { ticket, first: day(event), last: day(event) });
      tickets.push(ticket);
      continue;
    }
    tickets.push({ key: event._id, event, title: event.title, days: `${day(event)}.` });
  }
  return tickets;
}
