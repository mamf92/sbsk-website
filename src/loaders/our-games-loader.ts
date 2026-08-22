import { gamesHeroLoader } from '../sanity/queryHelpers/games-hero';
import { gamesLoader } from '../sanity/queryHelpers/games';
import { settle } from './settle';

/** Same split as `calendarLoader`: a failed hero must not cost the visitor the game list. */
export async function ourGamesLoader() {
  const [hero, games] = await Promise.all([
    settle(gamesHeroLoader().then((result) => result.gamesHero)),
    settle(gamesLoader().then((result) => result.games)),
  ]);

  return {
    gamesHero: hero.data ?? null,
    games: games.data ?? [],
    gamesFailed: games.failed,
  };
}
