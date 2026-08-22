import { client } from '../client';
import { type SanityImageSource } from '@sanity/image-url';

export interface GameTypes {
  _id: string;
  title: string;
  genre?: string;
  description?: string;
  image?: SanityImageSource;
  difficulty: 1 | 2 | 3;
  time: string;
  players: string;
  playersMin: number;
  playersMax: number;
  buyUrl?: string;
  bggUrl?: string;
  videoUrl?: string;
}

const GAMES_QUERY = `*[
  _type == "game"
] | order(title asc){
  _id,
  title,
  genre,
  description,
  image,
  difficulty,
  time,
  players,
  playersMin,
  playersMax,
  buyUrl,
  bggUrl,
  videoUrl
}`;

export async function gamesLoader() {
  return { games: await client.fetch<GameTypes[]>(GAMES_QUERY) };
}
