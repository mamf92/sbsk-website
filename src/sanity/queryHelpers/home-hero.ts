import { client } from '../client';
import { type SanityImageSource } from '@sanity/image-url';

export interface HomeHeroType {
  title?: string;
  subtitle?: string;
  image?: SanityImageSource;
  imageSource?: { imageSourceName?: string; imageSourceUrl?: string };
  links?: { label: string; url: string }[];
  sponsors?: { name: string; logoImage: SanityImageSource; websiteUrl: string }[];
}

const HOME_HERO_QUERY = `*[
  _type == "homeHero"
]{_id, title, subtitle, image{asset, crop, hotspot}, imageSource{imageSourceName, imageSourceUrl}, links, sponsors}[0]`;

export async function homeHeroLoader() {
  return { homeHero: await client.fetch<HomeHeroType | null>(HOME_HERO_QUERY) };
}
