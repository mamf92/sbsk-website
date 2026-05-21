import { client } from '../client';
import type { PortableTextBlock } from '@portabletext/types';

type PostContent =
  | PortableTextBlock
  | {
      _type: 'image';
      alt?: string;
      imageSourceName?: string;
      imageSourceUrl?: string;
    };

export interface PostTypes {
  _id: string;
  title: string;
  subtitle?: string;
  slug: { current: string };
  publishedAt: string;
  category: 'nyheter' | 'spillkveldrapporter' | 'arrangementer';
  links?: { label: string; url: string }[];
  content: PostContent[];
}

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, subtitle, slug, publishedAt, category, links, content}`;

export async function postsLoader() {
  return { posts: await client.fetch<PostTypes[]>(POSTS_QUERY) };
}
