import { client } from '../client';
import { type SanityImageSource } from '@sanity/image-url';

export interface AboutPageTypes {
  image?: SanityImageSource;
  imageSource?: { imageSourceName?: string; imageSourceUrl?: string };
  clubTitle?: string;
  clubIntro?: string;
  clubBody?: string[];
  boardTitle?: string;
  boardIntro?: string;
}

const ABOUT_PAGE_QUERY = `*[
  _type == "aboutPage"
]{
  _id,
  image,
  imageSource{imageSourceName, imageSourceUrl},
  clubTitle,
  clubIntro,
  clubBody,
  boardTitle,
  boardIntro
}[0]`;

export async function aboutPageLoader() {
  return { aboutPage: await client.fetch<AboutPageTypes | null>(ABOUT_PAGE_QUERY) };
}
