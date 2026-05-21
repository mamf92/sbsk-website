import { client } from '../client';

export interface PostsHeroTypes {
  title?: string;
  subtitle?: string;
}

const POSTS_HERO_QUERY = `*[
  _type == "postsHero"
]{_id, title, subtitle }[0]`;

export async function postsHeroLoader() {
  return { postsHero: await client.fetch<PostsHeroTypes | null>(POSTS_HERO_QUERY) };
}
