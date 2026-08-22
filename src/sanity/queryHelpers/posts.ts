import { client } from '../client';
import type { PortableTextBlock } from '@portabletext/types';
import type { SanityImageSource } from '@sanity/asset-utils';

export type PostImage = SanityImageSource & {
  alt?: string;
  imageSourceName?: string;
  imageSourceUrl?: string;
};

type PostContent =
  | PortableTextBlock
  | (PostImage & {
      _type: 'image';
      alignment?: 'venstre' | 'høyre';
    });

export interface PostTypes {
  _id: string;
  title: string;
  subtitle?: string;
  slug: { current: string };
  publishedAt: string;
  category: 'nyheter' | 'spillkveldrapporter' | 'arrangementer';
  links?: { label: string; url: string }[];
  mainImage?: PostImage;
  gallery?: PostImage[];
  content: PostContent[];
}

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{
  _id, title, subtitle, slug, publishedAt, category, links, content,
  mainImage{..., alt, imageSourceName, imageSourceUrl},
  gallery[]{..., alt, imageSourceName, imageSourceUrl}
}`;

export async function postsLoader() {
  return { posts: await client.fetch<PostTypes[]>(POSTS_QUERY) };
}

// `mainImage` is the intended source for the card thumbnail and gallery, but posts written
// before that field existed only have images inline in `content` — fall back to the first one
// of those so older posts don't just lose their teaser image.
export function getMainImage(post: PostTypes): PostImage | undefined {
  if (post.mainImage) return post.mainImage;
  return post.content?.find((block) => block._type === 'image') as PostImage | undefined;
}
