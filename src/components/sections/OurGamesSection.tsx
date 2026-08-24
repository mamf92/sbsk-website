import * as React from 'react';
import { Button } from '../ui/Buttons';
import { Chip } from '../ui/Chip';
import { Input } from '../ui/Input';
import { Dialog } from '../ui/Dialog';
import EmptyState from '../ui/EmptyState';
import { GameCard, type BuyInfo } from '../ui/GameCard';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/authContext/authContext';
import { urlFor } from '../../sanity/sanityImageUrl';
import type { GameTypes } from '../../sanity/queryHelpers/games';
import type { GamesHeroTypes } from '../../sanity/queryHelpers/games-hero';
import { FALLBACK_GAMES } from './fallbackGames';
import heroPlaceholderImage from '../../assets/images/hero-placeholder.jpg';

interface OurGamesProps {
  gamesHero?: GamesHeroTypes | null;
  games: GameTypes[];
}

/** `GameTypes` and `FallbackGame` normalize to this before render — the only difference
 * between them is where `image` comes from (a Sanity ref vs. a bundled asset URL), and this
 * is the one place that gets resolved. */
interface DisplayGame {
  _id: string;
  title: string;
  genre?: string;
  description?: string;
  image?: string;
  difficulty: 1 | 2 | 3;
  time: string;
  players: string;
  playersMin: number;
  playersMax: number;
  buyUrl?: string;
  bggUrl?: string;
  videoUrl?: string;
}

// One sponsor site-wide today, so this stays a constant rather than a schema. If a second
// discount partner shows up, promote it to a Sanity singleton next to `gamesHero` — this
// intentionally does not grow a schema for a case that does not exist yet.
const SPONSOR = {
  name: 'Outland',
  url: 'https://www.outland.no/',
  discountPercent: 15,
  discountCode: 'SBSK15',
};

const DIFFICULTIES: Array<{ value: 0 | 1 | 2 | 3; label: string }> = [
  { value: 0, label: 'Alle' },
  { value: 1, label: 'Lett' },
  { value: 2, label: 'Middels' },
  { value: 3, label: 'Vanskelig' },
];

const PLAYER_BUCKETS: Array<{ key: string; label: string; lo?: number; hi?: number }> = [
  { key: 'alle', label: 'Alle' },
  { key: '1-2', label: '1–2', lo: 1, hi: 2 },
  { key: '3-4', label: '3–4', lo: 3, hi: 4 },
  { key: '5+', label: '5+', lo: 5, hi: 99 },
];

export default function OurGamesSection({ gamesHero, games }: OurGamesProps) {
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = React.useState('');
  const [difficulty, setDifficulty] = React.useState<0 | 1 | 2 | 3>(0);
  const [playerBucket, setPlayerBucket] = React.useState('alle');
  const [buyInfo, setBuyInfo] = React.useState<BuyInfo | null>(null);

  // Real content wins the moment the Studio has any games in it — same rule
  // HomeHeroSection applies to its own hardcoded fallback.
  const gameList: DisplayGame[] =
    games.length > 0
      ? games.map((game) => ({
          ...game,
          image: game.image
            ? urlFor(game.image).width(600).height(600).fit('crop').url()
            : undefined,
        }))
      : FALLBACK_GAMES;

  const q = query.trim().toLowerCase();
  const bucket = PLAYER_BUCKETS.find((b) => b.key === playerBucket);
  const filteredGames = gameList.filter((game) => {
    if (
      q &&
      !(game.title.toLowerCase().includes(q) || (game.genre ?? '').toLowerCase().includes(q))
    ) {
      return false;
    }
    if (difficulty && game.difficulty !== difficulty) return false;
    if (bucket?.lo != null && bucket.hi != null) {
      if (!(game.playersMax >= bucket.lo && game.playersMin <= bucket.hi)) return false;
    }
    return true;
  });

  function clearFilters() {
    setQuery('');
    setDifficulty(0);
    setPlayerBucket('alle');
  }

  function handleBuy(info: BuyInfo) {
    try {
      navigator.clipboard?.writeText(info.discountCode);
    } catch {
      // Clipboard access throws on insecure origins — the code is still shown in the dialog.
    }
    setBuyInfo(info);
  }

  return (
    <div className="flex flex-col">
      <GamesHero gamesHero={gamesHero} />

      <div className="max-w-content content-gutter:px-0 mx-auto flex w-full flex-col gap-6 px-2 py-8">
        <Input
          type="search"
          icon="search"
          aria-label="Søk etter spill"
          placeholder="Søk etter spill…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-3">
            <FilterRow label="Vanskelighetsgrad">
              {DIFFICULTIES.map((d) => (
                <Chip
                  key={d.value}
                  active={difficulty === d.value}
                  onClick={() => setDifficulty(d.value)}
                >
                  {d.label}
                </Chip>
              ))}
            </FilterRow>
            <FilterRow label="Antall spillere">
              {PLAYER_BUCKETS.map((b) => (
                <Chip
                  key={b.key}
                  active={playerBucket === b.key}
                  onClick={() => setPlayerBucket(b.key)}
                >
                  {b.label}
                </Chip>
              ))}
            </FilterRow>
          </div>
        </div>

        {filteredGames.length === 0 ? (
          <EmptyState
            variant="inline"
            title="Ingen spill matcher søket"
            body="Prøv et annet søkeord eller nullstill filtrene."
            action={
              <Button variant="primary" size="lg" icon="backspace" onClick={clearFilters}>
                Fjern filtre
              </Button>
            }
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] items-stretch gap-5">
            {filteredGames.map((game) => (
              <GameCard
                key={game._id}
                title={game.title}
                genre={game.genre}
                description={game.description}
                image={game.image}
                difficulty={game.difficulty}
                time={game.time}
                players={game.players}
                buyUrl={game.buyUrl || SPONSOR.url}
                bggUrl={game.bggUrl}
                videoUrl={game.videoUrl}
                sponsor={SPONSOR.name}
                discountPercent={SPONSOR.discountPercent}
                discountCode={SPONSOR.discountCode}
                member={isAuthenticated}
                onBuy={handleBuy}
              />
            ))}
          </div>
        )}
      </div>

      <BuyConfirmDialog info={buyInfo} onClose={() => setBuyInfo(null)} />
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="min-w-[82px] text-xs font-bold tracking-[0.06em] text-gray-500 uppercase dark:text-gray-300">
        {label}
      </span>
      {children}
    </div>
  );
}

function GamesHero({ gamesHero }: { gamesHero?: GamesHeroTypes | null }) {
  const navigate = useNavigate();
  const title = gamesHero?.title || 'Våre spill';
  const subtitle =
    gamesHero?.subtitle ||
    'Sjekk ut spillene i samlingen vår. Som medlem får du rabatt hos vår samarbeidspartner Outland.';
  const imageUrl = gamesHero?.image
    ? urlFor(gamesHero.image).width(1440).fit('crop').url()
    : heroPlaceholderImage;

  return (
    <div className="relative flex h-[calc(62vh)] flex-col items-center justify-center p-4">
      <div className="absolute inset-0">
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="absolute inset-0 flex h-[calc(62vh)] flex-col justify-center bg-white/50 p-4 dark:bg-black/50">
        <div className="max-w-content mx-auto flex w-full flex-col items-start gap-6">
          <div className="max-w-form flex flex-col items-start gap-3">
            <h1 className="text-darkestblue font-heading text-h1 text-left font-bold dark:text-white">
              {title}
            </h1>
            <p className="text-darkestblue text-left text-lg font-normal dark:text-white">
              {subtitle}
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            icon="right"
            onClick={() => navigate('/bli-medlem')}
            className="flex-none"
          >
            Bli medlem
          </Button>
        </div>
      </div>
    </div>
  );
}

function BuyConfirmDialog({ info, onClose }: { info: BuyInfo | null; onClose: () => void }) {
  if (!info) return null;

  return (
    <Dialog title="Rabattkode kopiert" onClose={onClose}>
      <p className="text-white">
        Koden <b className="font-heading">{info.discountCode}</b> er kopiert. Bruk den i kassen hos{' '}
        {info.sponsor} for å få rabatten på {info.title}.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="primary"
          size="lg"
          icon="right"
          onClick={() => {
            window.open(info.buyUrl, '_blank', 'noopener');
            onClose();
          }}
        >
          Fortsett til {info.sponsor}
        </Button>
        <Button variant="tertiary" size="lg" onClick={onClose}>
          Lukk
        </Button>
      </div>
    </Dialog>
  );
}
