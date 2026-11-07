import type { LoaderFunctionArgs } from 'react-router-dom';
import { toPlainText } from '@portabletext/react';
import { client } from '../client';
import type { PortableTextBlock } from '@portabletext/types';
import type { SanityImageValue } from '../../components/ui/SanityImage';

export type PostImage = SanityImageValue & { _type: 'image' };

type PostContent = PortableTextBlock | PostImage;

export interface PostTypes {
  _id: string;
  title: string;
  subtitle?: string;
  publishedAt: string;
  category: 'nyheter' | 'spillkveldrapporter' | 'arrangementer';
  links?: { label: string; url: string }[];
  content: PostContent[];
  carousel?: PostImage[];
}

// The image blocks are sub-projected so `metadata.dimensions` comes along: without the real
// aspect ratio the renderer cannot reserve the right box, and every photo shifts the text under
// it as it loads. The `...` spread keeps `hotspot` and `crop` at the block level, which is where
// @sanity/image-url looks for them — dereferencing the asset alone would drop the editor's
// framing on the floor.
const POSTS_QUERY = `*[
  _type == "post"
]|order(publishedAt desc)[0...12]{
  _id, title, subtitle, publishedAt, category, links,
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
  }
}`;

// One post by its document id, for `/innlegg/:id`. Same projection as the list, so the page and
// the card it came from never disagree.
const POST_BY_ID_QUERY = `*[_type == "post" && _id == $id][0]{
  _id, title, subtitle, publishedAt, category, links,
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
  }
}`;

export async function postDetailLoader({ params }: LoaderFunctionArgs) {
  const id = params.id;
  if (!id) throw new Response('Missing post id', { status: 400 });

  const post = await client.fetch<PostTypes | null>(POST_BY_ID_QUERY, { id });
  // An empty-result stub answers `[]` rather than `null`; neither is a post.
  if (!post || Array.isArray(post)) throw new Response('Post not found', { status: 404 });

  return { post };
}

/** The route of a post's own page. */
export function postPath(id: string): string {
  return `/innlegg/${encodeURIComponent(id)}`;
}

export const POST_CATEGORY_LABELS: Record<PostTypes['category'], string> = {
  nyheter: 'Nyheter',
  spillkveldrapporter: 'Spillkveldrapport',
  arrangementer: 'Arrangementer',
};

/** Spillkveld write-ups and events are the club's orange side; news is blue. */
export const POST_CATEGORY_TONES: Record<PostTypes['category'], 'blue' | 'orange'> = {
  nyheter: 'blue',
  spillkveldrapporter: 'orange',
  arrangementer: 'orange',
};

/** The card's summary: the editor's subtitle if there is one, else the start of the body. */
export function postSummary(post: PostTypes): string {
  if (post.subtitle) return post.subtitle;
  const blocks = (post.content ?? []).filter(
    (block): block is PortableTextBlock => block._type === 'block',
  );
  return toPlainText(blocks);
}

/** "5. juni 2026". */
export function postDateLabel(publishedAt: string): string {
  return new Date(publishedAt).toLocaleDateString('no-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export async function postsLoader() {
  return { posts: await client.fetch<PostTypes[]>(POSTS_QUERY) };
}

// The card's photo is simply the post's first photo: an inline one if the body has one, otherwise
// the carousel's first image. There is deliberately no separate "teaser image" field to fill in,
// so the picture on the card is always one the reader meets again on the post's page.
export function getThumbnail(post: PostTypes): PostImage | undefined {
  const inline = post.content?.find((block) => block._type === 'image') as PostImage | undefined;
  return inline ?? post.carousel?.[0];
}
