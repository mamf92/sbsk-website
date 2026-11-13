import type { LoaderFunctionArgs } from 'react-router-dom';
import { client } from '../sanity/client';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { EVENT_DETAIL_PROJECTION } from '../sanity/queryHelpers/events';
import {
  CURRENT_BGM_QUERY,
  FESTIVAL_PROJECTION,
  type FestivalTypes,
} from '../sanity/queryHelpers/festivals';
import { osloDateKey } from '../utils/eventDateFormat';

// One round trip for both kinds of page that live under /arrangementer/:slug. An event only
// counts when its editor gave it a page; a festival always has one.
export const ARRANGEMENT_BY_SLUG_QUERY = `{
  "event": *[_type == "event" && slug.current == $slug && hasDetailPage == true][0]${EVENT_DETAIL_PROJECTION},
  "festival": *[_type == "festival" && slug.current == $slug][0]${FESTIVAL_PROJECTION}
}`;

export type ArrangementData =
  | { kind: 'event'; event: CalendarEventTypes }
  | { kind: 'festival'; festival: FestivalTypes };

/** `/arrangementer/:id`: an event with its own page, or a festival. 404 when neither. */
export async function arrangementLoader({ params }: LoaderFunctionArgs): Promise<ArrangementData> {
  const slug = params.id;
  if (!slug) throw new Response('Missing slug', { status: 400 });

  const result = await client.fetch<{
    event: CalendarEventTypes | null;
    festival: FestivalTypes | null;
  }>(ARRANGEMENT_BY_SLUG_QUERY, { slug });

  // Studio keeps slugs unique across both types; if that is ever bypassed, the festival wins,
  // since it is the bigger page and the one people are sent to.
  if (result?.festival) return { kind: 'festival', festival: result.festival };
  if (result?.event) return { kind: 'event', event: result.event };
  throw new Response('Not found', { status: 404 });
}

/**
 * `/board-game-masters`: the current edition, or `null` until one is published, in which case
 * the page keeps its placeholder. Never a 404: the footer links here.
 */
export async function boardGameMastersLoader(): Promise<{ festival: FestivalTypes | null }> {
  const festival = await client.fetch<FestivalTypes | null>(CURRENT_BGM_QUERY, {
    today: osloDateKey(new Date()),
  });
  return { festival: festival ?? null };
}
