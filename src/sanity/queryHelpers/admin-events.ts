import { client } from '../client';

/**
 * Events as the board portal needs them: the next few for the overview, and the ones around
 * today for door check-in. Its own module rather than a projection in `events.ts`, so the
 * public event pages and the admin pages can change independently.
 *
 * Festivals (Board Game Masters) are included as one row each, keyed by the festival `_id`:
 * check-in and sign-ups are counted per festival, not per day.
 */
export interface AdminEvent {
  _id: string;
  _type: 'event' | 'festival';
  title: string;
  /** ISO date-time (events) or ISO date (festivals, first day). */
  start: string;
  /** ISO date-time (events) or ISO date (festivals, last day). */
  end: string;
  category: string | null;
  location: string | null;
  slug: string | null;
  hasDetailPage: boolean;
}

const ADMIN_EVENT_PROJECTION = `{
  _id,
  _type,
  "title": coalesce(title.nb, title),
  "start": coalesce(eventStartTime, days[0].date),
  "end": coalesce(eventEndTime, days[-1].date, eventStartTime, days[0].date),
  "category": select(_type == "festival" => "festival", category),
  "location": coalesce(location, venue.name, days[0].venue.name),
  "slug": slug.current,
  "hasDetailPage": select(_type == "festival" => true, hasDetailPage == true)
}`;

// `end >= $from` keeps an event that is under way; festivals compare dates, so `$fromDate`.
export const ADMIN_UPCOMING_EVENTS_QUERY = `*[
  (_type == "event" && eventEndTime >= $from)
  || (_type == "festival" && days[-1].date >= $fromDate)
] | order(coalesce(eventStartTime, days[0].date) asc)[0...20]${ADMIN_EVENT_PROJECTION}`;

export const ADMIN_EVENTS_BETWEEN_QUERY = `*[
  (_type == "event" && eventEndTime >= $from && eventStartTime <= $to)
  || (_type == "festival" && days[-1].date >= $fromDate && days[0].date <= $toDate)
] | order(coalesce(eventStartTime, days[0].date) asc)${ADMIN_EVENT_PROJECTION}`;

export const ADMIN_EVENT_BY_ID_QUERY = `*[_id == $id && _type in ["event", "festival"]][0]${ADMIN_EVENT_PROJECTION}`;

const isoDate = (date: Date) => date.toISOString().slice(0, 10);

export async function getUpcomingEventsForAdmin(
  limit = 5,
  now = new Date(),
): Promise<AdminEvent[]> {
  const events = await client.fetch<AdminEvent[] | null>(ADMIN_UPCOMING_EVENTS_QUERY, {
    from: now.toISOString(),
    fromDate: isoDate(now),
  });
  // GROQ slices take constants only; 20 bounds the fetch, the caller's limit trims it.
  return (events ?? []).slice(0, limit);
}

/** Events from the start of today through `days` days ahead: the check-in picker. */
export async function getCheckInEvents(days = 7, now = new Date()): Promise<AdminEvent[]> {
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + days + 1);
  const events = await client.fetch<AdminEvent[] | null>(ADMIN_EVENTS_BETWEEN_QUERY, {
    from: from.toISOString(),
    to: to.toISOString(),
    fromDate: isoDate(from),
    toDate: isoDate(to),
  });
  return events ?? [];
}

export async function getAdminEvent(id: string): Promise<AdminEvent | null> {
  return client.fetch<AdminEvent | null>(ADMIN_EVENT_BY_ID_QUERY, { id });
}
