import type { LoaderFunctionArgs } from 'react-router-dom';
import { client } from '../client';
import type { PortableTextBlock } from '@portabletext/types';
import type { SanityImageValue } from '../../components/ui/SanityImage';

export type PostImage = SanityImageValue & { _type: 'image' };

// `alignment` only means something for a photo sitting inline in running text — a carousel
// image's layout is decided by the carousel itself, so `PostImage` alone (no alignment) is what
// `carousel` uses.
type InlinePostImage = PostImage & { alignment?: 'høyre' | 'venstre' | 'full' };

type PostContent = PortableTextBlock | InlinePostImage;

export interface PostTypes {
  _id: string;
  title: string;
  subtitle?: string;
  slug: { current: string };
  publishedAt: string;
  category: 'nyheter' | 'spillkveldrapporter' | 'arrangementer';
  links?: { label: string; url: string }[];
  content: PostContent[];
  carousel?: PostImage[];
  /** Post page only: the event or festival the post belongs to, when it has a page. */
  relatedEvent?: { title?: string; path?: string | null } | null;
}

// The image blocks are sub-projected so `metadata.dimensions` comes along: without the real
// aspect ratio the renderer cannot reserve the right box, and every photo shifts the text under
// it as it loads. The `...` spread keeps `hotspot` and `crop` at the block level, which is where
// @sanity/image-url looks for them — dereferencing the asset alone would drop the editor's
// framing on the floor.
const POST_FIELDS = `
  _id, title, subtitle, slug, publishedAt, category, links,
  content[]{
    ...,
    _type == "image" => {
      ...,
      asset->{_id, url, metadata{dimensions, lqip}}
    }
  },
  carousel[]{
    ...,
    asset->{_id, url, metadata{dimensions, lqip}}
  }`;

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{${POST_FIELDS}
}`;

// The related event resolves to a path only when it has a page: a festival always does, an
// event only with `hasDetailPage`. A calendar-only event is not linked.
export const POST_BY_SLUG_QUERY = `*[_type == "post" && slug.current == $slug][0]{${POST_FIELDS},
  "relatedEvent": relatedEvent->{
    "title": select(_type == "festival" => coalesce(title.nb, title.en), title),
    "path": select(
      _type == "festival" && defined(slug.current) => "/arrangementer/" + slug.current,
      _type == "event" && hasDetailPage == true && defined(slug.current) => "/arrangementer/" + slug.current
    )
  }
}`;

/** `/innlegg/:id`: one post by its slug. 404 when there is none. */
export async function postDetailLoader({ params }: LoaderFunctionArgs) {
  const slug = params.id;
  if (!slug) throw new Response('Missing post slug', { status: 400 });
  const post = await client.fetch<PostTypes | null>(POST_BY_SLUG_QUERY, { slug });
  if (!post || typeof post !== 'object' || !('_id' in post)) {
    throw new Response('Post not found', { status: 404 });
  }
  return { post };
}

export async function postsLoader() {
  return { posts: await client.fetch<PostTypes[]>(POSTS_QUERY) };
}

// The closed card's thumbnail is simply the post's first photo — an inline one if the body has
// one, otherwise the carousel's own first image, so a carousel-only post still gets a thumbnail
// and the header's collapse animation. There is deliberately no separate "teaser image" field to
// fill in and no way for it to disagree with the body — the picture a reader sees on the closed
// card is one they meet again at the top of the article.
export function getThumbnail(post: PostTypes): PostImage | undefined {
  const inline = post.content?.find((block) => block._type === 'image') as PostImage | undefined;
  return inline ?? post.carousel?.[0];
}
