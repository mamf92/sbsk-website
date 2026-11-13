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
