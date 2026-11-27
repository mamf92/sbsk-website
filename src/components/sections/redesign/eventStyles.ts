import type { CalendarEventTypes } from '../../../sanity/queryHelpers/events';
import type { PostTypes } from '../../../sanity/queryHelpers/posts';

type Category = CalendarEventTypes['category'];

/**
 * How the new pages colour an event by category: the small square or block that carries the
 * colour (`chip`) and a letter for when there is no room for a name (the month grid on a phone).
 * Spillkveld stays navy, like today's calendar (`CATEGORY_STYLES` in `CalendarSection`), so
 * orange is never the only difference between a tournament and «annet».
 */
export const EVENT_CATEGORY: Record<Category, { label: string; letter: string; chip: string }> = {
  spillkveld: { label: 'Spillkveld', letter: 'S', chip: 'bg-darkblue text-white' },
  turnering: { label: 'Turnering', letter: 'T', chip: 'bg-orange text-darkestblue' },
  annet: { label: 'Annet', letter: 'A', chip: 'bg-darkorange text-darkestblue' },
};

export const eventCategory = (category: Category) =>
  EVENT_CATEGORY[category] ?? EVENT_CATEGORY.spillkveld;

/** The pin colour and label of a post on «Oppslagstavla». */
export const POST_CATEGORY: Record<PostTypes['category'], { label: string; pin: string }> = {
  nyheter: { label: 'Nyheter', pin: 'bg-darkblue' },
  spillkveldrapporter: { label: 'Spillkveldrapport', pin: 'bg-orange' },
  arrangementer: { label: 'Arrangement', pin: 'bg-darkorange' },
};

export const postCategory = (category: PostTypes['category']) =>
  POST_CATEGORY[category] ?? POST_CATEGORY.nyheter;
