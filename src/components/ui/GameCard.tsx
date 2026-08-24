import * as React from 'react';
import Signal from '../../assets/icons/symbols/signal.svg?react';
import Clock from '../../assets/icons/symbols/clock.svg?react';
import Players from '../../assets/icons/symbols/players.svg?react';
import Tag from '../../assets/icons/symbols/tag.svg?react';
import ExternalLink from '../../assets/icons/symbols/external-link.svg?react';
import BoardGameGeek from '../../assets/icons/brands/boardgamegeek.svg?react';
import YouTube from '../../assets/icons/brands/youtube.svg?react';

export interface BuyInfo {
  title: string;
  sponsor: string;
  discountCode: string;
  buyUrl: string;
}

type GameCardProps = {
  title: string;
  genre?: string;
  description?: string;
  /** A resolved image URL — either a Sanity `urlFor(...)` string or a local asset import. */
  image?: string;
  difficulty: 1 | 2 | 3;
  time: string;
  timeUnit?: string;
  players: string;
  playersUnit?: string;
  buyUrl: string;
  bggUrl?: string;
  videoUrl?: string;
  sponsor: string;
  discountPercent: number;
  discountCode: string;
  /** From the real session (`useAuth().isAuthenticated`), not local review state. */
  member: boolean;
  /**
   * Fires instead of the plain navigation when `member` is true — the caller owns the
   * copy-code / confirm / redirect flow (`OurGamesSection`'s discount dialog).
   */
  onBuy?: (info: BuyInfo) => void;
};

const DIFFICULTY_LABEL = { 1: 'Lett', 2: 'Middels', 3: 'Vanskelig' } as const;

export function GameCard({
  title,
  genre,
  description,
  image,
  difficulty,
  time,
  timeUnit = 'min',
  players,
  playersUnit = 'spillere',
  buyUrl,
  bggUrl,
  videoUrl,
  sponsor,
  discountPercent,
  discountCode,
  member,
  onBuy,
}: GameCardProps) {
  const difficultyLabel = DIFFICULTY_LABEL[difficulty];
  const buyLabel = member ? `Kjøp med −${discountPercent} % rabatt` : `Kjøp hos ${sponsor}`;

  function handleBuy(event: React.MouseEvent<HTMLAnchorElement>) {
    if (member && onBuy) {
      event.preventDefault();
      onBuy({ title, sponsor, discountCode, buyUrl });
    }
  }

  return (
    <article className="dark:bg-darkblue lift-card text-darkestblue flex w-full flex-col border border-black bg-white dark:border-white dark:text-white">
      <div className="bg-darkblue relative aspect-square overflow-hidden border-b border-black dark:border-white">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold tracking-[0.08em] text-white uppercase opacity-70">
            Spillfoto
          </span>
        )}
        {member && (
          <span className="bg-orange text-darkestblue absolute top-3 right-0 px-3 py-1.5 text-xs font-bold tracking-[0.03em]">
            −{discountPercent}% MEDLEM
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {genre && (
          <p className="text-darkorange m-0 text-xs font-bold tracking-[0.04em] uppercase">
            {genre}
          </p>
        )}
        <h3 className="font-heading text-h3 mt-1 mb-0 font-bold">{title}</h3>
        {description && (
          <p className="mt-1.5 mb-0 text-base leading-normal text-gray-500 dark:text-gray-300">
            {description}
          </p>
        )}

        <div className="my-3 flex border-t border-b border-black dark:border-white">
          <div className="flex flex-1 flex-row items-center justify-center gap-1.5 p-2 text-center">
            <Signal aria-hidden="true" className="h-[18px] w-[18px] fill-current" />
            <span
              className="flex gap-[3px]"
              role="img"
              aria-label={`Vanskelighetsgrad: ${difficultyLabel}`}
            >
              {[1, 2, 3].map((n) => (
                <span
                  key={n}
                  aria-hidden="true"
                  className={
                    'h-[9px] w-[9px] border ' +
                    (n <= difficulty
                      ? 'border-darkorange bg-orange'
                      : 'border-darkestblue bg-transparent dark:border-white')
                  }
                />
              ))}
            </span>
          </div>
          <div className="flex flex-1 flex-row items-center justify-center gap-1.5 border-l border-gray-300 p-2 text-center dark:border-white/30">
            <Clock aria-hidden="true" className="h-[18px] w-[18px] fill-current" />
            <span className="font-heading text-xs font-bold">
              {time} {timeUnit}
            </span>
          </div>
          <div className="flex flex-1 flex-row items-center justify-center gap-1.5 border-l border-gray-300 p-2 text-center dark:border-white/30">
            <Players aria-hidden="true" className="h-[18px] w-[18px] fill-none stroke-current" />
            <span className="font-heading text-xs font-bold">
              {players} {playersUnit}
            </span>
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2.5">
          <a
            href={buyUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleBuy}
            className="bg-orange border-orange not-disabled:hover:bg-darkorange not-disabled:hover:border-darkorange lift font-heading text-darkestblue flex h-11 w-full items-center justify-center gap-2 border text-base font-bold tracking-[0.02em]"
          >
            {member && <Tag aria-hidden="true" className="h-[15px] w-[15px]" />}
            {buyLabel}
            <ExternalLink aria-hidden="true" className="h-3.5 w-3.5 fill-current" />
          </a>
          <p className="m-0 text-center text-sm text-gray-500 dark:text-gray-300">
            {member ? (
              'Rabattkoden legges inn automatisk i kassen'
            ) : (
              <>
                Medlemmer får{' '}
                <b className="text-darkestorange dark:text-orange font-heading">
                  {discountPercent}&thinsp;% rabatt
                </b>{' '}
                hos {sponsor}
              </>
            )}
          </p>
          {(bggUrl || videoUrl) && (
            <div className="mt-1 flex gap-2">
              {bggUrl && (
                <a
                  href={bggUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Se på BoardGameGeek"
                  aria-label="Se på BoardGameGeek"
                  className="border-darkestblue not-disabled:hover:bg-darkestblue dark:not-disabled:hover:text-darkestblue lift flex h-11 min-w-11 flex-1 items-center justify-center border not-disabled:hover:text-white dark:border-white dark:not-disabled:hover:bg-white"
                >
                  <BoardGameGeek aria-hidden="true" className="h-5 w-auto fill-current" />
                </a>
              )}
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Se videoforklaring på YouTube"
                  aria-label="Se videoforklaring på YouTube"
                  className="border-darkestblue not-disabled:hover:bg-darkestblue dark:not-disabled:hover:text-darkestblue lift flex h-11 min-w-11 flex-1 items-center justify-center gap-2 border text-xs font-bold not-disabled:hover:text-white dark:border-white dark:not-disabled:hover:bg-white"
                >
                  <YouTube aria-hidden="true" className="h-[18px] w-auto fill-current" />
                  YouTube
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
