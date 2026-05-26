import { homeHeroLoader } from '../sanity/queryHelpers/home-hero';
import { postsLoader } from '../sanity/queryHelpers/posts';

export async function homeLoader() {
  const { homeHero } = await homeHeroLoader();
  const { posts } = await postsLoader();
  return { homeHero, posts };
}
