import * as React from 'react';
import { buttonClasses } from './buttonClasses';
import { Tag as CategoryTag } from './Tag';
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

// `Avansert`, not `Vanskelig` (#223) — the pip meter says how demanding the game is to learn,
// which "advanced" names without implying the game is a slog. Must stay in step with
// `DIFFICULTIES` in `OurGamesSection`: the filter chip and the card's own label read the same
// number, so two spellings of it would look like two different scales.
const DIFFICULTY_LABEL = { 1: 'Lett', 2: 'Middels', 3: 'Avansert' } as const;

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
    <article className="bg-surface text-fg shadow-card flex w-full flex-col rounded-none">
      <div className="bg-surface-muted relative aspect-video overflow-hidden">
        {image ? (
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span aria-hidden="true" className="absolute inset-0" />
        )}
        {member && (
          <span className="bg-tag-orange-bg text-tag-orange-fg absolute top-3 left-3 px-2 py-0.5 text-xs font-semibold">
            −{discountPercent} % for medlemmer
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {/* Same head as the post `Card` (decision 9): tag, title, two-line summary. */}
        {genre && (
          <div>
            <CategoryTag>{genre}</CategoryTag>
          </div>
        )}
        <h3 className="font-heading text-heading text-h4 mt-2 mb-0 font-bold">{title}</h3>
        {description && (
          <p className="text-fg-muted mt-2 mb-0 line-clamp-2 text-base">{description}</p>
        )}

        <div className="border-border my-3 flex border-t border-b">
          <div className="flex flex-1 flex-row items-center justify-center gap-1.5 p-2 text-center">
            <Signal aria-hidden="true" className="text-fg-muted size-4 fill-current" />
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
                    'size-2.5 border ' +
                    (n <= difficulty ? 'border-fg bg-fg' : 'border-border-strong bg-transparent')
                  }
                />
              ))}
            </span>
          </div>
          <div className="border-border flex flex-1 flex-row items-center justify-center gap-1.5 border-l p-2 text-center">
            <Clock aria-hidden="true" className="text-fg-muted size-4 fill-current" />
            <span className="text-sm">
              {time} {timeUnit}
            </span>
          </div>
          <div className="border-border flex flex-1 flex-row items-center justify-center gap-1.5 border-l p-2 text-center">
            <Players aria-hidden="true" className="text-fg-muted size-4 fill-none stroke-current" />
            <span className="text-sm">
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
            className={buttonClasses({
              variant: 'primary',
              size: 'md',
              className: 'w-full',
            })}
          >
            {member && <Tag aria-hidden="true" className="size-4 fill-current" />}
            {buyLabel}
            <ExternalLink aria-hidden="true" className="size-3.5 fill-current" />
          </a>
          <p className="text-fg-muted m-0 text-center text-sm">
            {member ? (
              'Rabattkoden legges inn automatisk i kassen'
            ) : (
              <>
                Medlemmer får{' '}
                <b className="text-fg font-semibold">{discountPercent}&thinsp;% rabatt</b> hos{' '}
                {sponsor}
              </>
            )}
          </p>
          {/* Two on one row under the full-width buy link, never three across (#223): at the
              290px the grid tracks bottom out at, a third would leave each button too narrow
              for its label. Both `flex-1`, so one on its own still spans the row rather than
              sitting off to one side. The BGG mark is a wordmark and needs no label; the video
              link takes one, because a bare play button does not say what it plays. */}
          {(bggUrl || videoUrl) && (
            <div className="mt-1 flex gap-2">
              {bggUrl && (
                <a
                  href={bggUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Se på BoardGameGeek"
                  aria-label="Se på BoardGameGeek"
                  className={buttonClasses({
                    variant: 'secondary',
                    size: 'md',
                    className: 'min-w-11 flex-1',
                  })}
                >
                  <BoardGameGeek aria-hidden="true" className="h-5 w-auto fill-current" />
                </a>
              )}
              {videoUrl && (
                <a
                  href={videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Se reglene forklart på video"
                  className={buttonClasses({
                    variant: 'secondary',
                    size: 'md',
                    className: 'min-w-11 flex-1 text-sm',
                  })}
                >
                  <YouTube aria-hidden="true" className="h-4 w-auto fill-current" />
                  Se reglene
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}
