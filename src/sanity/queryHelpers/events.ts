import type { LoaderFunctionArgs } from 'react-router-dom';
import { type SanityImageSource } from '@sanity/image-url';
import { client } from '../client';
import type { PortableTextBlock } from 'sanity';

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
  links
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
  links
}`;

export async function eventsListLoader() {
  const events = await client.fetch<CalendarEventTypes[]>(EVENTS_LIST_QUERY);
  return { events };
}

export async function eventDetailLoader({ params }: LoaderFunctionArgs) {
  const slug = params.id;
  if (!slug) throw new Response('Missing event slug', { status: 400 });

  const event = await client.fetch<CalendarEventTypes>(EVENT_BY_SLUG_QUERY, { slug });
  if (!event) throw new Response('Event not found', { status: 404 });

  return { event };
}
