import { useLoaderData } from 'react-router-dom';
import OurGamesSection from '../components/sections/OurGamesSection';
import type { GamesHeroTypes } from '../sanity/queryHelpers/games-hero';
import type { GameTypes } from '../sanity/queryHelpers/games';

export default function OurGames() {
  const { gamesHero, games } = useLoaderData() as {
    gamesHero: GamesHeroTypes | null;
    games: GameTypes[];
  };

  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white dark:text-white">
      <OurGamesSection gamesHero={gamesHero} games={games} />
    </div>
  );
}
