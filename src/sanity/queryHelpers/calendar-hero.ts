import { client } from '../client';
import { type SanityImageSource } from '@sanity/image-url';

export interface CalendarHeroTypes {
  title?: string;
  subtitle?: string;
  image?: SanityImageSource;
  imageSourceName?: string;
  imageSourceUrl?: string;
}

// The credit is flattened onto the hero because `CalendarHero` takes it flat. Projecting the
// `imageSource` object as-is left both props undefined, so an editor's credit never showed.
// One document per page: the Studio opens the one with the fixed id `calendarHero`. The type match is
// the fallback for a document created before the Studio pinned that id.
const CALENDAR_HERO_QUERY = `coalesce(*[_id == "calendarHero"][0], *[_type == "calendarHero"][0]){_id, title, subtitle, image{asset, crop, hotspot}, "imageSourceName": imageSource.imageSourceName, "imageSourceUrl": imageSource.imageSourceUrl}`;

export async function calendarHeroLoader() {
  return { calendarHero: await client.fetch<CalendarHeroTypes | null>(CALENDAR_HERO_QUERY) };
}
