import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { calendarEventIcs } from './eventIcs';
import { buildIcsCalendar } from './ics';

/** The subscription feed's file name, at the root of each build (`/kalender.ics`). */
export const CALENDAR_FEED_FILE = 'kalender.ics';

/** How far back the feed reaches: a subscriber keeps recent nights without a growing archive. */
const PAST_DAYS = 90;

/**
 * The club calendar as one subscribable .ics: every event (festival days included) that ended
 * within the last 90 days or is still to come. Entry UIDs match the per-event «Legg i
 * kalenderen» download, so an event someone downloaded is updated rather than duplicated once
 * they subscribe.
 */
export function buildCalendarFeed(
  events: CalendarEventTypes[],
  siteUrl: string,
  now = new Date(),
): string {
  const from = now.getTime() - PAST_DAYS * 86_400_000;
  const entries = events
    .filter((event) => new Date(event.eventEndTime).getTime() >= from)
    .sort((a, b) => +new Date(a.eventStartTime) - +new Date(b.eventStartTime))
    .map((event) => calendarEventIcs(event, siteUrl));
  return buildIcsCalendar(entries, {
    name: 'Stavanger Brettspillklubb',
    description: 'Spillkvelder, turneringer og festivaler i Stavanger Brettspillklubb.',
    refresh: 'PT12H',
  });
}

/** The feed's address for calendar apps: `webcal://` opens the subscribe dialog directly. */
export function calendarFeedUrls(siteUrl: string) {
  const https = new URL(CALENDAR_FEED_FILE, siteUrl).href;
  return {
    https,
    webcal: https.replace(/^https?:/, 'webcal:'),
    google: `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(
      https.replace(/^https?:/, 'webcal:'),
    )}`,
  };
}
