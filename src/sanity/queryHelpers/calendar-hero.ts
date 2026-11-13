import { client } from '../client';
import { type SanityImageSource } from '@sanity/image-url';

export interface CalendarHeroTypes {
  title?: string;
  subtitle?: string;
  image?: SanityImageSource;
  imageSourceName?: string;
  imageSourceUrl?: string;
}

// The credit is flattened here because `CalendarHeroTypes` (and the hero) read it at the top
// level; returned nested, the editor's credit never reached the page and Freepik's showed.
const CALENDAR_HERO_QUERY = `*[
  _type == "calendarHero"
]{_id, title, subtitle, image{asset, crop, hotspot}, "imageSourceName": imageSource.imageSourceName, "imageSourceUrl": imageSource.imageSourceUrl}[0]`;

export async function calendarHeroLoader() {
  return { calendarHero: await client.fetch<CalendarHeroTypes | null>(CALENDAR_HERO_QUERY) };
}
