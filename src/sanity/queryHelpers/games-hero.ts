import { client } from '../client';
import { type SanityImageSource } from '@sanity/image-url';

export interface GamesHeroTypes {
  title?: string;
  subtitle?: string;
  image?: SanityImageSource;
  imageSource?: { imageSourceName?: string; imageSourceUrl?: string };
}

const GAMES_HERO_QUERY = `*[
  _type == "gamesHero"
]{_id, title, subtitle, image, imageSource{imageSourceName, imageSourceUrl}}[0]`;

export async function gamesHeroLoader() {
  return { gamesHero: await client.fetch<GamesHeroTypes | null>(GAMES_HERO_QUERY) };
}
