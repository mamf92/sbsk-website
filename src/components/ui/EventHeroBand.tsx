import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

/**
 * The navy hero of an event or festival page on the new pages: a back link, the page's own
 * heading and facts on the left, a picture on the right (under the text on a phone). The same
 * band, dot pattern and grid as the front page's «Neste spillkveld», so an event page reads as
 * the next step from a poster.
 *
 * `wideMedia` gives the picture the larger column, for a banner that carries its own artwork.
 */
export function EventHeroBand({
  back,
  media,
  wideMedia = false,
  children,
}: {
  back: { to: string; label: string };
  media?: ReactNode;
  wideMedia?: boolean;
  children: ReactNode;
}) {
  const columns = !media
    ? ''
    : wideMedia
      ? 'lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'
      : 'lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]';
  return (
    <section className="bg-darkblue surface-dark dot-pattern relative overflow-hidden text-white">
      <div
        className={`max-w-shell relative mx-auto grid items-center gap-8 px-4 pt-5 pb-10 sm:px-6 lg:pb-12 ${columns}`}
      >
        <div className="flex min-w-0 flex-col gap-4">
          <Link
            to={back.to}
            className="font-body focus-visible:outline-focus-ring w-fit text-sm text-white/80 underline underline-offset-4 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            <span aria-hidden="true">← </span>
            {back.label}
          </Link>
          {children}
        </div>
        {media && <div className="min-w-0">{media}</div>}
      </div>
    </section>
  );
}

EventHeroBand.displayName = 'EventHeroBand';
