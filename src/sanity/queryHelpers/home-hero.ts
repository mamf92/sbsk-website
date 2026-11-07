import { client } from '../client';
import { type SanityImageSource } from '@sanity/image-url';

export interface HomeHeroTypes {
  title?: string;
  subtitle?: string;
  image?: SanityImageSource;
  imageSource?: { imageSourceName?: string; imageSourceUrl?: string };
  links?: { label: string; url: string }[];
  sponsors?: { name: string; logoImage: SanityImageSource; websiteUrl: string }[];
}

// One document per page: the Studio opens the one with the fixed id `homeHero`. The type match is
// the fallback for a document created before the Studio pinned that id.
const HOME_HERO_QUERY = `coalesce(*[_id == "homeHero"][0], *[_type == "homeHero"][0]){_id, title, subtitle, image{asset, crop, hotspot}, imageSource{imageSourceName, imageSourceUrl}, links, sponsors}`;

export async function homeHeroLoader() {
  return { homeHero: await client.fetch<HomeHeroTypes | null>(HOME_HERO_QUERY) };
}
