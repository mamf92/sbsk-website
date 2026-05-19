import { client } from '../client';
import { type SanityImageSource } from '@sanity/image-url';

export interface CalendarHeroTypes {
  title?: string;
  subtitle?: string;
  image?: SanityImageSource;
  imageSourceName?: string;
  imageSourceUrl?: string;
}

const CALENDAR_HERO_QUERY = `*[
  _type == "calendarHero"
]{_id, title, subtitle, image{asset, crop, hotspot}, imageSource{imageSourceName, imageSourceUrl}}[0]`;

export async function calendarHeroLoader() {
  return { calendarHero: await client.fetch<CalendarHeroTypes | null>(CALENDAR_HERO_QUERY) };
}
