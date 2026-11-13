import * as React from 'react';
import { PortableText } from '@portabletext/react';
import { Link } from './Link';
import { useEventsT } from '../../i18n';
import { pickLocale } from '../../i18n/pickLocale';
import { useLocale } from '../../hooks/locale/useLocale';
import { components } from '../../sanity/editors/portableTextComponents';
import type { VenueTypes } from '../../sanity/queryHelpers/fragments';
import { mapUrl } from '../../utils/mapUrl';

type VenueCardProps = Omit<React.HTMLAttributes<HTMLElement>, 'children'> & {
  venue: VenueTypes | null | undefined;
  /** Overrides the heading, e.g. for a festival day held somewhere else. */
  title?: React.ReactNode;
  headingLevel?: 'h2' | 'h3';
};

/**
 * «Oppmøte»: where to go and how to get in. Every part is optional except the place's name;
 * a venue without one renders nothing.
 */
export const VenueCard = React.forwardRef<HTMLElement, VenueCardProps>(
  ({ venue, title, headingLevel = 'h2', className = '', ...props }, ref) => {
    const t = useEventsT();
    const { locale } = useLocale();
    if (!venue?.name) return null;

    const Heading = headingLevel;
    const SubHeading = headingLevel === 'h2' ? 'h3' : 'h4';
    const langOf = (lang: string) => (lang !== locale ? lang : undefined);
    const meetingPoint = pickLocale(venue.meetingPoint, locale);
    const directions = pickLocale(venue.directions, locale);
    const accessibility = pickLocale(venue.accessibility, locale);

    return (
      <section
        ref={ref}
        className={[
          'bg-darkblue font-body flex flex-col gap-4 p-6 text-white sm:p-8',
          className,
        ].join(' ')}
        {...props}
      >
        <Heading className="font-heading text-h3 font-bold">{title ?? t('venue.title')}</Heading>
        <div className="flex flex-col gap-1">
          <p className="font-bold">{venue.name}</p>
          {venue.address && (
            <p>
              {venue.address} ·{' '}
              <Link
                href={mapUrl(venue.address)}
                target="_blank"
                rel="noopener noreferrer"
                variant="inherit"
                className="underline"
              >
                {t('venue.showMap')}
                <span className="sr-only"> {t('opensInNewTab')}</span>
              </Link>
            </p>
          )}
          {venue.doorsOpen && <p>{t('venue.doorsOpen', { time: venue.doorsOpen })}</p>}
        </div>
        {meetingPoint && (
          <div className="flex flex-col gap-1">
            <SubHeading className="font-heading font-bold">{t('venue.meetingPoint')}</SubHeading>
            <p lang={langOf(meetingPoint.lang)}>{meetingPoint.value}</p>
          </div>
        )}
        {directions && (
          <div className="flex flex-col gap-1">
            <SubHeading className="font-heading font-bold">{t('venue.directions')}</SubHeading>
            <div className="sbsk-rt" lang={langOf(directions.lang)}>
              <PortableText value={directions.value} components={components} />
            </div>
          </div>
        )}
        {accessibility && (
          <div className="flex flex-col gap-1">
            <SubHeading className="font-heading font-bold">{t('venue.accessibility')}</SubHeading>
            <p lang={langOf(accessibility.lang)}>{accessibility.value}</p>
          </div>
        )}
        {venue.contact && <p>{t('venue.contact', { name: venue.contact })}</p>}
      </section>
    );
  },
);

VenueCard.displayName = 'VenueCard';
