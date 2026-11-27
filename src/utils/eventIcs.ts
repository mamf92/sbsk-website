import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { osloDateKey } from './eventDateFormat';
import type { IcsEventInput } from './ics';

/**
 * A calendar row as an .ics entry: the per-event «Legg i kalenderen» download and the
 * `kalender.ics` subscription feed both build from this, so an event a subscriber already has
 * and one they downloaded share a UID and update rather than duplicate each other.
 *
 * `siteUrl` is the site's absolute root with a trailing slash; the entry links to the event's
 * page when it has one, else to the calendar.
 */
export function calendarEventIcs(
  event: Pick<
    CalendarEventTypes,
    | '_id'
    | 'title'
    | 'eventStartTime'
    | 'eventEndTime'
    | 'location'
    | 'allDay'
    | 'festivalDay'
    | 'detailPath'
    | 'hasDetailPage'
    | 'eventSlug'
  >,
  siteUrl?: string,
): IcsEventInput {
  const start = new Date(event.eventStartTime);
  const path =
    event.detailPath ??
    (event.hasDetailPage && event.eventSlug ? `/arrangementer/${event.eventSlug}` : '/kalender');
  return {
    title: event.title,
    start,
    end: new Date(event.eventEndTime),
    location: event.location,
    allDayDate: event.allDay ? osloDateKey(start) : undefined,
    url: siteUrl ? `${siteUrl.replace(/\/$/, '')}${path}` : undefined,
    // A festival day's row id is `festival:dayKey`; `festivalDayIcs` names the same day
    // `festival-dayKey`, so the two agree.
    uid: event.festivalDay ? event._id.replace(':', '-') : event._id,
  };
}
