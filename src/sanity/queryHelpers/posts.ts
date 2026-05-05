import { client } from '../client';

export interface Post {
  _id: string;
  title: string;
  slug: { current: string };
  publishedAt: string;
  image?: { asset: { _ref: string } };
  body: { children: { text: string }[] }[];
}

const POSTS_QUERY = `*[
  _type == "post"
  && defined(slug.current)
]|order(publishedAt desc)[0...12]{_id, title, slug, publishedAt, image, body}`;

export async function postsLoader() {
  return { posts: await client.fetch<Post[]>(POSTS_QUERY) };
}
