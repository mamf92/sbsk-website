import { homeHeroLoader } from '../sanity/queryHelpers/home-hero';
import { postsLoader } from '../sanity/queryHelpers/posts';
import { settle } from './settle';

/**
 * The hero and the posts feed are independent pieces of content from independent queries, so one
 * of them failing is not a reason to lose the other. Awaiting them in sequence meant a hero that
 * failed to load took the whole front page down with it — the second half of #63.
 *
 * Each part resolves to its data or to an error flag, and the page renders what it has.
 */
export async function homeLoader() {
  const [hero, posts] = await Promise.all([
    settle(homeHeroLoader().then((result) => result.homeHero)),
    settle(postsLoader().then((result) => result.posts)),
  ]);

  return {
    homeHero: hero.data ?? null,
    posts: posts.data ?? [],
    // Distinguished from "loaded, and there is nothing" on purpose: telling a visitor there are no
    // posts when the truth is we could not reach Sanity is a lie the empty state cannot tell apart.
    postsFailed: posts.failed,
  };
}
