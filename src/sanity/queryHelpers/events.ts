import type { LoaderFunctionArgs } from 'react-router-dom';
import { type SanityImageSource } from '@sanity/image-url';
import { client } from '../client';
import type { PortableTextBlock } from 'sanity';
import type { CalendarEventParticipantTypes } from './updateEventParticipants';

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
  participants?: CalendarEventParticipantTypes[];
}

const EVENTS_LIST_QUERY = `*[
  _type == "event" && eventEndTime >= now()
] | order(eventStartTime asc){
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
  participants
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
  participants
}`;

const EVENT_BY_SLUG_QUERY = `*[
  _type == "event"
  && slug.current == $slug
][0]{
  _id,
  title,
  content,
  eventStartTime,
  eventEndTime,
  category,
  "eventSlug": slug.current,
  location,
  links,
  participants
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
