import type { LoaderFunctionArgs } from 'react-router-dom';
import { type SanityImageSource } from '@sanity/image-url';
import { client } from '../client';
import type { PortableTextBlock } from 'sanity';

export interface EventSponsorTypes {
  logo?: SanityImageSource;
  altText: string;
  link?: string;
  ctaLabel?: string;
  ctaLink?: string;
}

export interface EventScheduleEntryTypes {
  _key: string;
  label: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

export interface CalendarEventTypes {
  _id: string;
  title: string;
  content?: PortableTextBlock[];
  image?: SanityImageSource;
  eventStartTime: Date;
  eventEndTime: Date;
  category: 'spillkveld' | 'turnering' | 'annet';
  eventSlug?: string;
  location?: string;
  links?: { label: string; url: string }[];
  /** Whether the event has its own page at `/arrangementer/:slug` — a content decision, not
   *  something inferred from category or from having inline content. */
  hasDetailPage?: boolean;
  signupUrl?: { label?: string; url?: string };
  showSponsors?: boolean;
  sponsors?: EventSponsorTypes[];
  pricingInfo?: PortableTextBlock[];
  programInfo?: PortableTextBlock[];
  schedule?: EventScheduleEntryTypes[];
}

// Fields every list/calendar row needs — including `hasDetailPage`, which decides whether the
// row links out at all. The richer detail-only fields (sponsors, pricing, schedule…) are only
// fetched by `EVENT_BY_SLUG_QUERY` below.
const EVENT_ROW_PROJECTION = `
  _id,
  title,
  content,
  image,
  eventStartTime,
  eventEndTime,
  category,
  "eventSlug": slug.current,
  location,
  links,
  hasDetailPage
`;

const EVENTS_LIST_QUERY = `*[
  _type == "event" && eventEndTime >= now()
] | order(eventStartTime asc){
  ${EVENT_ROW_PROJECTION}
}`;

// The Kalender page needs past events too — its scope filter offers "Tidligere" and "Alle"
// alongside "Kommende", which `EVENTS_LIST_QUERY` cannot serve because it drops anything
// already finished. Ordered newest-first and capped so the archive cannot grow unbounded:
// the slice keeps the 200 most recent events, which is every upcoming one plus a deep
// backlog. The section re-sorts client-side, so the descending order here is not the
// display order.
const CALENDAR_EVENTS_QUERY = `*[
  _type == "event"
] | order(eventStartTime desc)[0...200]{
  ${EVENT_ROW_PROJECTION}
}`;

const EVENT_BY_SLUG_QUERY = `*[
  _type == "event"
  && slug.current == $slug
][0]{
  _id,
  title,
  content,
  image,
  eventStartTime,
  eventEndTime,
  category,
  "eventSlug": slug.current,
  location,
  links,
  hasDetailPage,
  signupUrl,
  showSponsors,
  sponsors[]{ logo, altText, link, ctaLabel, ctaLink },
  pricingInfo,
  programInfo,
  schedule[]{ _key, label, startTime, endTime, location }
}`;

export async function eventsListLoader() {
  const events = await client.fetch<CalendarEventTypes[]>(EVENTS_LIST_QUERY);
  if (!events) throw new Response('Events not found', { status: 404 });

  return { events };
}

export async function calendarEventsLoader() {
  const events = await client.fetch<CalendarEventTypes[]>(CALENDAR_EVENTS_QUERY);
  // An empty archive is a legitimate state — the calendar renders its own empty copy — so
  // this resolves to `[]` rather than throwing the way the upcoming-only list does.
  return { events: events ?? [] };
}

export async function eventDetailLoader({ params }: LoaderFunctionArgs) {
  const slug = params.id;
  if (!slug) throw new Response('Missing event slug', { status: 400 });

  const event = await client.fetch<CalendarEventTypes>(EVENT_BY_SLUG_QUERY, { slug });
  if (!event) throw new Response('Event not found', { status: 404 });

  return { event };
}
