import type { LoaderFunctionArgs } from 'react-router-dom';
import { client } from '../client';

const EVENTS_LIST_QUERY = `*[_type == "event"] | order(publishedAt desc){_id,title,slug,publishedAt}`;

const EVENT_BY_SLUG_QUERY = `*[
  _type == "event"
  && slug.current == $slug
][0]{_id, title}`;

export async function eventsListLoader() {
  const events = await client.fetch(EVENTS_LIST_QUERY);
  return { events };
}

export async function eventDetailLoader({ params }: LoaderFunctionArgs) {
  const slug = params.id;
  if (!slug) throw new Response('Missing event slug', { status: 400 });

  const event = await client.fetch(EVENT_BY_SLUG_QUERY, { slug });
  if (!event) throw new Response('Event not found', { status: 404 });

  return { event };
}
