import { client } from '../client';
import { type SanityImageSource } from '@sanity/image-url';

export interface GamesHeroTypes {
  title?: string;
  subtitle?: string;
  image?: SanityImageSource;
  links?: { label: string; url: string }[];
}

// One document per page: the Studio opens the one with the fixed id `gamesHero`. The type match is
// the fallback for a document created before the Studio pinned that id.
const GAMES_HERO_QUERY = `coalesce(*[_id == "gamesHero"][0], *[_type == "gamesHero"][0]){_id, title, subtitle, image, links}`;

export async function gamesHeroLoader() {
  return { gamesHero: await client.fetch<GamesHeroTypes | null>(GAMES_HERO_QUERY) };
}
