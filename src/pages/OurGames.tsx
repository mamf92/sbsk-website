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
    <div className="bg-page text-fg min-h-[60vh]">
      <OurGamesSection gamesHero={gamesHero} games={games} />
    </div>
  );
}
