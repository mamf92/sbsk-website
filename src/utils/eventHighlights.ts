import type { SanityImageSource } from '@sanity/image-url';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { eventDetailPath } from './eventLinks';
import { clockTime, osloDaysBetween } from './eventDateFormat';

/**
 * Which events the new front page and calendar treat as routine and which as «special».
 *
 * The club's rhythm is a game night every other Thursday plus a handful of special events a
 * season. The new pages show the routine as a row of dates and give the special ones a poster,
 * so this one rule decides which is which. Keep every page on it, or a julespillkveld could be a
 * poster on the front page and a plain date on the calendar.
 */

/** Events that have not ended at `now`, soonest first. */
export function upcomingEvents(events: CalendarEventTypes[], now: Date): CalendarEventTypes[] {
  return events
    .filter((event) => new Date(event.eventEndTime).getTime() >= now.getTime())
    .sort((a, b) => new Date(a.eventStartTime).getTime() - new Date(b.eventStartTime).getTime());
}

/** A plain game night: category «spillkveld», and not a day of a festival. */
export function isGameNight(event: CalendarEventTypes): boolean {
  return event.category === 'spillkveld' && !event.festivalDay;
}

/**
 * Special: a festival day, a tournament or «annet» event, or a game night the editors marked
 * out with its own page or its own image (a themed night such as Julespillkveld). An ordinary
 * game night, with neither, is routine.
 */
export function isSpecialEvent(event: CalendarEventTypes): boolean {
  if (event.festivalDay) return true;
  if (event.category !== 'spillkveld') return true;
  return !!event.hasDetailPage || !!event.image;
}

/** The next game night that has not ended, or else the next event of any kind. */
export function nextGameNight(events: CalendarEventTypes[], now: Date): CalendarEventTypes | null {
  const upcoming = upcomingEvents(events, now);
  return upcoming.find(isGameNight) ?? upcoming[0] ?? null;
}

/** «i kveld», «i dag», «i morgen», «om 6 dager»: how far away a start is, in Oslo days. */
export function countdownLabel(start: Date, now: Date): string {
  const days = osloDaysBetween(now, start);
  if (days <= 0) return Number(clockTime(start).slice(0, 2)) >= 16 ? 'i kveld' : 'i dag';
  if (days === 1) return 'i morgen';
  return `om ${days} dager`;
}

export type HighlightKind = 'festival' | 'turnering' | 'annet' | 'spillkveld';

/** One poster: a special event, or a whole festival folded into one. */
export interface Highlight {
  key: string;
  kind: HighlightKind;
  title: string;
  start: Date;
  end: Date;
  /** Only dates are known: the poster shows «Hele dagen» rather than 00:00–23:59. */
  allDay?: boolean;
  location?: string;
  /** Where the poster links; null when the event has no page. */
  href: string | null;
  /** The editor's image, if any. The poster falls back to house art by kind. */
  image: SanityImageSource | null;
  /** The event document behind it, for sign-up. Absent for a festival. */
  event?: CalendarEventTypes;
}

/**
 * The special events from `now` on, as posters, soonest first. A festival's days fold into one
 * poster spanning its first to last day and linking to the festival page.
 */
export function eventHighlights(events: CalendarEventTypes[], now: Date): Highlight[] {
  const out: Highlight[] = [];
  const festivals = new Map<string, Highlight>();
  for (const event of upcomingEvents(events, now).filter(isSpecialEvent)) {
    const start = new Date(event.eventStartTime);
    const end = new Date(event.eventEndTime);
    if (event.festivalDay && event.festival) {
      const existing = festivals.get(event.festival.slug);
      if (existing) {
        if (end > existing.end) existing.end = end;
        existing.allDay = existing.allDay && !!event.allDay;
        continue;
      }
      const highlight: Highlight = {
        key: `festival:${event.festival.slug}`,
        kind: 'festival',
        title: event.festival.name,
        start,
        end,
        allDay: !!event.allDay,
        location: event.location,
        href: `/arrangementer/${event.festival.slug}`,
        image: event.festival.image ?? null,
      };
      festivals.set(event.festival.slug, highlight);
      out.push(highlight);
      continue;
    }
    out.push({
      key: event._id,
      kind: event.category,
      title: event.title,
      start,
      end,
      allDay: !!event.allDay,
      location: event.location,
      href: eventDetailPath(event),
      image: event.image ?? null,
      event,
    });
  }
  return out;
}

/** The label a poster or row carries for its kind. */
export const KIND_LABEL: Record<HighlightKind, string> = {
  festival: 'Festival',
  turnering: 'Turnering',
  annet: 'Annet',
  spillkveld: 'Spillkveld',
};

/** The third fact on a poster for a visitor: what they need to know about coming. */
export function visitorAttendance(highlight: Highlight): string {
  if (highlight.kind === 'festival') return 'Program';
  if (highlight.kind === 'spillkveld') return 'Åpent for alle';
  return 'Påmelding';
}
