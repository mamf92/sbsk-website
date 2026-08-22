import { client } from '../client';
import type { PortableTextBlock } from '@portabletext/types';
import type { SanityImageValue } from '../../components/ui/SanityImage';

export type PostImage = SanityImageValue & { _type: 'image' };

type PostContent = PortableTextBlock | PostImage;

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

// The image blocks are sub-projected so `metadata.dimensions` comes along: without the real
// aspect ratio the renderer cannot reserve the right box, and every photo shifts the text under
// it as it loads. The `...` spread keeps `hotspot` and `crop` at the block level, which is where
// @sanity/image-url looks for them — dereferencing the asset alone would drop the editor's
// framing on the floor.
const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{
  _id, title, subtitle, slug, publishedAt, category, links,
  content[]{
    ...,
    _type == "image" => {
      ...,
      asset->{_id, url, metadata{dimensions, lqip}}
    }
  }
}`;

export async function postsLoader() {
  return { posts: await client.fetch<PostTypes[]>(POSTS_QUERY) };
}

// The closed card's thumbnail is simply the post's first photo. There is deliberately no
// separate "teaser image" field to fill in and no way for the two to disagree — the picture a
// reader sees on the closed card is the one they meet again at the top of the article.
export function getThumbnail(post: PostTypes): PostImage | undefined {
  return post.content?.find((block) => block._type === 'image') as PostImage | undefined;
}
