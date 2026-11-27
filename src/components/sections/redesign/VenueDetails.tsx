import { PortableText } from '@portabletext/react';
import { InfoList, InfoRow } from '../../ui/InfoCard';
import { useEventsT } from '../../../i18n';
import { pickLocale } from '../../../i18n/pickLocale';
import { useLocale } from '../../../hooks/locale/useLocale';
import { components } from '../../../sanity/editors/portableTextComponents';
import type { VenueTypes } from '../../../sanity/queryHelpers/fragments';
import { googleMapsUrl } from '../../../utils/mapUrl';

/**
 * The practical facts about a place as `InfoRow`s: where to meet, how to get there,
 * accessibility and a contact. With `withPlace`, the place itself (name, address, map link)
 * and the doors-open time lead the list, for a festival day held somewhere other than the hero
 * says. Renders nothing when there is nothing to list.
 */
export function VenueDetails({
  venue,
  withPlace = false,
}: {
  venue: VenueTypes | null | undefined;
  withPlace?: boolean;
}) {
  const t = useEventsT();
  const { locale } = useLocale();
  if (!venue) return null;
  const langOf = (lang: string) => (lang !== locale ? lang : undefined);
  const nbLang = locale === 'nb' ? undefined : 'nb';
  const meetingPoint = pickLocale(venue.meetingPoint, locale);
  const directions = pickLocale(venue.directions, locale);
  const accessibility = pickLocale(venue.accessibility, locale);
  const place = withPlace ? venue.name : undefined;
  if (!place && !meetingPoint && !directions && !accessibility && !venue.contact) return null;
  const mapQuery = [venue.name, venue.address ?? 'Stavanger'].filter(Boolean).join(', ');

  return (
    <InfoList>
      {place && (
        <InfoRow label={t('redesign.place')} lang={nbLang}>
          <span className="font-bold">{place}</span>
          {venue.address && <span className="block">{venue.address}</span>}
          {venue.doorsOpen && (
            <span className="block" lang={locale}>
              {t('venue.doorsOpen', { time: venue.doorsOpen })}
            </span>
          )}
          <a
            href={googleMapsUrl(mapQuery)}
            target="_blank"
            rel="noopener noreferrer"
            lang={locale}
            className="focus-visible:outline-focus-ring text-sm underline underline-offset-4 focus-visible:outline-2"
          >
            {t('venue.showMap')}
          </a>
        </InfoRow>
      )}
      {meetingPoint && (
        <InfoRow label={t('venue.title')} lang={langOf(meetingPoint.lang)}>
          {meetingPoint.value}
        </InfoRow>
      )}
      {directions && (
        <InfoRow label={t('venue.directions')} lang={langOf(directions.lang)}>
          <div className="sbsk-rt">
            <PortableText value={directions.value} components={components} />
          </div>
        </InfoRow>
      )}
      {accessibility && (
        <InfoRow label={t('venue.accessibility')} lang={langOf(accessibility.lang)}>
          {accessibility.value}
        </InfoRow>
      )}
      {venue.contact && <InfoRow label={t('festival.contactTitle')}>{venue.contact}</InfoRow>}
    </InfoList>
  );
}
