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

// One document per page: the Studio opens the one with the fixed id `aboutPage`. The type match is
// the fallback for a document created before the Studio pinned that id.
const ABOUT_PAGE_QUERY = `coalesce(*[_id == "aboutPage"][0], *[_type == "aboutPage"][0]){
  _id,
  image,
  imageSource{imageSourceName, imageSourceUrl},
  clubTitle,
  clubIntro,
  clubBody,
  boardTitle,
  boardIntro
}`;

export async function aboutPageLoader() {
  return { aboutPage: await client.fetch<AboutPageTypes | null>(ABOUT_PAGE_QUERY) };
}
