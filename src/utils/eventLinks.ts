import type { CalendarEventTypes } from '../sanity/queryHelpers/events';

/**
 * Where a calendar or list row links, or null when it has no page. Whether an event has a page
 * is a content decision (`hasDetailPage`); a festival day carries its own path.
 */
export function eventDetailPath(
  event: Pick<CalendarEventTypes, 'detailPath' | 'hasDetailPage' | 'eventSlug'>,
): string | null {
  if (event.detailPath) return event.detailPath;
  return event.hasDetailPage && event.eventSlug ? `/arrangementer/${event.eventSlug}` : null;
}

/** The query parameter on /kalender/alle that opens, scrolls to and highlights one event. */
export const FOCUS_EVENT_PARAM = 'arrangement';

/**
 * Where a click on an event goes in the new calendar pages: its own page when it has one,
 * otherwise «Alle arrangementer» with that event opened and highlighted. One rule for every
 * clickable event, so a visitor always learns the same thing from a click.
 */
export function eventLink(
  event: Pick<CalendarEventTypes, '_id' | 'detailPath' | 'hasDetailPage' | 'eventSlug'>,
): string {
  return (
    eventDetailPath(event) ?? `/kalender/alle?${FOCUS_EVENT_PARAM}=${encodeURIComponent(event._id)}`
  );
}
