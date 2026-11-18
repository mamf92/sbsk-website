import * as React from 'react';
import type { SanityImageSource } from '@sanity/image-url';
import { HeroImage } from './HeroImage';

type EventHeroProps = Omit<React.HTMLAttributes<HTMLElement>, 'title'> & {
  title: React.ReactNode;
  /** `lang` of the title (and lead) when it differs from the page's. */
  titleLang?: string;
  /** A short label above the title: the edition, «Arrangement». */
  kicker?: React.ReactNode;
  /** One sentence under the title. */
  lead?: React.ReactNode;
  leadLang?: string;
  /** The when · where line. */
  meta?: React.ReactNode;
  /**
   * The event's banner, shown whole above the title band: festival art often carries its own
   * lettering, so it is never cropped or darkened behind text. Absent, the band stands alone.
   */
  image?: SanityImageSource | null;
};

/**
 * The top of an event page: the banner, then a title band with the page's one `<h1>`. Shared by
 * the single-event page and the festival page so both open the same way.
 */
export const EventHero = React.forwardRef<HTMLElement, EventHeroProps>(
  (
    { title, titleLang, kicker, lead, leadLang, meta, image, className = '', children, ...props },
    ref,
  ) => (
    <header ref={ref} className={['flex flex-col', className].join(' ')} {...props}>
      {image && (
        <div className="bg-darkestblue aspect-video w-full overflow-hidden print:hidden">
          <HeroImage image={image} priority />
        </div>
      )}
      <div className="bg-darkblue surface-dark flex flex-col items-start gap-3 p-6 text-white sm:p-8 print:bg-white print:p-0 print:text-black">
        {kicker}
        <h1 className="font-heading text-h1 tracking-heading font-bold" lang={titleLang}>
          {title}
        </h1>
        {lead && (
          <p className="font-body max-w-form text-lg" lang={leadLang}>
            {lead}
          </p>
        )}
        {meta && <p className="font-body font-bold">{meta}</p>}
        {children}
      </div>
    </header>
  ),
);

EventHero.displayName = 'EventHero';
