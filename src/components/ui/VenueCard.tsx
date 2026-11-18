import * as React from 'react';
import { PortableText } from '@portabletext/react';
import { Link } from './Link';
import { Panel } from './Panel';
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
  /**
   * The page already shows the place and the doors-open time in its key facts
   * (`EventKeyInfo`). The card then leaves out the doors line, and renders nothing at all when
   * it would only repeat the place's name.
   */
  inKeyFacts?: boolean;
};

/**
 * «Oppmøte»: where to go and how to get in. Every part is optional except the place's name;
 * a venue without one renders nothing.
 */
export const VenueCard = React.forwardRef<HTMLElement, VenueCardProps>(
  ({ venue, title, headingLevel = 'h2', inKeyFacts = false, className = '', ...props }, ref) => {
    const t = useEventsT();
    const { locale } = useLocale();
    if (!venue?.name) return null;

    const SubHeading = headingLevel === 'h2' ? 'h3' : 'h4';
    const langOf = (lang: string) => (lang !== locale ? lang : undefined);
    const meetingPoint = pickLocale(venue.meetingPoint, locale);
    const directions = pickLocale(venue.directions, locale);
    const accessibility = pickLocale(venue.accessibility, locale);
    const hasMore =
      !!venue.address || !!meetingPoint || !!directions || !!accessibility || !!venue.contact;
    if (inKeyFacts && !hasMore) return null;

    return (
      <Panel
        ref={ref}
        title={title ?? t('venue.title')}
        headingLevel={headingLevel}
        className={className}
        {...props}
      >
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
          {venue.doorsOpen && !inKeyFacts && (
            <p>{t('venue.doorsOpen', { time: venue.doorsOpen })}</p>
          )}
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
      </Panel>
    );
  },
);

VenueCard.displayName = 'VenueCard';
