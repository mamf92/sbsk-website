import { client } from '../client';

export interface HomeHeroType {
  title?: string;
  subtitle?: string;
  imageUrl?: string;
  imageSource?: string;
  imageSourceUrl?: string;
  links?: { label: string; url: string }[];
  sponsors?: { name: string; logoUrl: string; websiteUrl: string }[];
}

const HOME_HERO_QUERY = `*[
  _type == "homeHero"
]{_id, title, subtitle, imageUrl, imageSource, imageSourceUrl, link, sponsors}[0]`;

export async function homeHeroLoader() {
  return { homeHero: await client.fetch<HomeHeroType | null>(HOME_HERO_QUERY) };
}
