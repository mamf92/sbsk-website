import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { SanityImageSource } from '@sanity/image-url';
import { urlFor } from '../../sanity/sanityImageUrl';
import { KIND_LABEL, type HighlightKind } from '../../utils/eventHighlights';
import { dayOfMonth, monthAbbreviation, osloDateKey, timeRange } from '../../utils/eventDateFormat';
import { buttonClasses } from './buttonClasses';
import { posterArt } from '../../utils/posterArt';
import { DateStamp } from './DateStamp';
import { FactsStrip } from './FactsStrip';
import Clock from '../../assets/icons/symbols/clock.svg?react';
import Pin from '../../assets/icons/symbols/locationpin.svg?react';
import Players from '../../assets/icons/symbols/players.svg?react';
import ArrowRight from '../../assets/icons/arrows/arrowright.svg?react';
export type EventPosterCardProps = {
  kind: HighlightKind;
  title: string;
  start: Date;
  end: Date;
  location?: string;
  image: SanityImageSource | null;
  /** Where «Les mer» goes. Without it the card shows `actions` only. */
  href: string | null;
  /** The third fact: «Påmelding», «Billett», «12 kommer». */
  attendance: string;
  /** Extra actions under the facts, such as a member's sign-up. */
  actions?: ReactNode;
  /** A wide poster: a 21:9 image and a larger title, for a card that spans its row. */
  wide?: boolean;
};

/**
 * A special event as a poster: art with a stamped date, the category and place above the title,
 * the facts strip, then the action. Built like `GameCard`, so the two card families read as one.
 */
export function EventPosterCard({
  kind,
  title,
  start,
  end,
  location,
  image,
  href,
  attendance,
  actions,
  wide = false,
}: EventPosterCardProps) {
  const sameDay = osloDateKey(start) === osloDateKey(end);
  const place = location?.split(',')[0];
  const src = image
    ? urlFor(image)
        .width(wide ? 1280 : 800)
        .height(wide ? 549 : 450)
        .fit('crop')
        .auto('format')
        .url()
    : posterArt(kind, title);
  return (
    <article
      className={`dark:bg-darkblue surface-light dark:surface-dark text-darkestblue border-darkestblue relative flex w-full min-w-0 flex-col border-2 bg-white dark:border-white dark:text-white`}
    >
      <div className="relative">
        <img
          src={src}
          alt=""
          loading="lazy"
          className={`border-darkestblue w-full border-b-2 object-cover dark:border-white ${
            wide ? 'aspect-[21/9]' : 'aspect-video'
          }`}
        />
        <span className="font-heading bg-darkestblue absolute top-3 left-3 px-2 py-1 text-xs font-extrabold tracking-[0.16em] text-white uppercase">
          {KIND_LABEL[kind]}
        </span>
        <DateStamp start={start} end={end} className="absolute right-4 -bottom-7" />
      </div>
      <div className="flex flex-1 flex-col p-4 pt-5">
        <p className="text-darkestorange dark:text-orange m-0 pr-24 text-xs font-bold tracking-[0.04em] uppercase">
          {KIND_LABEL[kind]}
          {place ? ` · ${place}` : ''}
        </p>
        <h3 className={`font-heading mt-1 pr-24 font-bold ${wide ? 'text-h2' : 'text-h3'}`}>
          {title}
        </h3>
        <FactsStrip
          facts={[
            {
              key: 'time',
              icon: (
                <Clock aria-hidden="true" className="h-[18px] w-[18px] flex-none fill-current" />
              ),
              content: (
                <span className="font-heading text-xs font-bold">
                  {sameDay
                    ? timeRange(start, end).replace(/^\S+\s/, '')
                    : `${dayOfMonth(start)}.–${dayOfMonth(end)}. ${monthAbbreviation(end).toLowerCase()}`}
                </span>
              ),
            },
            {
              key: 'place',
              icon: <Pin aria-hidden="true" className="h-[18px] w-[18px] flex-none fill-current" />,
              content: <span className="font-heading text-xs font-bold">{place ?? 'Kommer'}</span>,
            },
            {
              key: 'attendance',
              icon: (
                <Players
                  aria-hidden="true"
                  className="h-[18px] w-[18px] flex-none fill-none stroke-current"
                />
              ),
              content: <span className="font-heading text-xs font-bold">{attendance}</span>,
            },
          ]}
        />
        <div className="mt-auto flex flex-col gap-2.5">
          {actions}
          {href && (
            <Link
              to={href}
              className={buttonClasses({
                variant: actions ? 'outline' : 'primary',
                size: 'md',
                className: 'w-full',
              })}
            >
              Les mer <span className="sr-only">om {title}</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4 fill-current" />
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}

EventPosterCard.displayName = 'EventPosterCard';
