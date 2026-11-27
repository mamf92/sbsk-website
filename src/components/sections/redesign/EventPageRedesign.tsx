import { PortableText, toPlainText } from '@portabletext/react';
import type { CalendarEventTypes } from '../../../sanity/queryHelpers/events';
import { components } from '../../../sanity/editors/portableTextComponents';
import { EventHeroBand } from '../../ui/EventHeroBand';
import { HeroFact, HeroFactNote } from '../../ui/HeroFact';
import { InfoCard, InfoList, InfoRow } from '../../ui/InfoCard';
import { Polaroid } from '../../ui/Polaroid';
import { NoticeLine } from '../../ui/NoticeLine';
import { DateStamp } from '../../ui/DateStamp';
import { Eyebrow } from '../../ui/Eyebrow';
import { Button } from '../../ui/Buttons';
import { HeroImage } from '../../ui/HeroImage';
import { SectionHeading } from '../../ui/SectionHeading';
import { SponsorLine } from '../../ui/Sponsors';
import { RelatedPosts } from '../../ui/RelatedPosts';
import { EventSignUp } from './EventSignUp';
import { useEventsT } from '../../../i18n';
import { pickLocale } from '../../../i18n/pickLocale';
import { useLocale, useTranslatedContent } from '../../../hooks/locale/useLocale';
import { useAuth } from '../../../hooks/authContext/authContext';
import { useRsvp } from '../../../hooks/useRsvp';
import { memberPortalEnabled } from '../../../utils/featureFlags';
import { countdownLabel } from '../../../utils/eventHighlights';
import { googleMapsUrl } from '../../../utils/mapUrl';
import { downloadIcs, type IcsEventInput } from '../../../utils/ics';
import { openExternal, safeExternalUrl } from '../../../utils/safeUrl';
import { signupState } from '../../../utils/signup';
import {
  clockTime,
  formatDateTime,
  formatDayLong,
  parseInstant,
  timeRange,
} from '../../../utils/eventDateFormat';
import Clock from '../../../assets/icons/symbols/clock.svg?react';
import Pin from '../../../assets/icons/symbols/locationpin.svg?react';
import Tag from '../../../assets/icons/symbols/tag.svg?react';
import Players from '../../../assets/icons/symbols/players.svg?react';

/** Above this many characters the price text goes to «Godt å vite»; the hero keeps one line. */
const SHORT_PRICE = 140;

const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * An event's own page in the new design (`redesignEnabled`). The hero answers what a guest asks
 * first: when (with doors), where (with address and map), what it costs, how to sign up, and one
 * main button. The text below holds the description and programme; «Godt å vite» only what the
 * hero does not already say, and is left out when there is nothing. Every fact shows once.
 *
 * A member gets the club's own «Bli med» only on a drop-in event: an event with Spond or a link
 * has one way in, the same for everyone.
 */
export function EventPageRedesign({ event }: { event: CalendarEventTypes }) {
  useTranslatedContent();
  const t = useEventsT();
  const { locale } = useLocale();
  const nbLang = locale === 'nb' ? undefined : 'nb';
  const now = new Date();
  const { isAuthenticated, user } = useAuth();

  const start = new Date(event.eventStartTime);
  const end = new Date(event.eventEndTime);
  const past = end < now;
  const place = event.venue?.name ?? event.location;
  const address = event.venue?.address;
  const mapQuery = [place, address].filter(Boolean).join(', ');
  const signup = event.signup;
  const state = signupState(signup, now);
  const dropIn = state === 'dropIn' || state === 'none';
  const member = memberPortalEnabled && isAuthenticated && !!user;
  const clubSignUp = member && dropIn;
  const rsvp = useRsvp(clubSignUp ? [event] : []);
  const signupUrl = safeExternalUrl(signup?.url);
  const canSignUp = state === 'open' && !!signupUrl;
  const sponsors = event.showSponsors ? (event.sponsors ?? []) : [];

  const note = pickLocale(signup?.note, locale);
  const label = pickLocale(signup?.label, locale);
  const priceField = pickLocale(signup?.price, locale);
  const priceText = event.pricingInfo?.length ? toPlainText(event.pricingInfo) : '';
  const priceInHero = priceText && priceText.length <= SHORT_PRICE;
  const heroPrice = priceInHero
    ? { value: priceText, lang: nbLang }
    : priceField
      ? { value: priceField.value, lang: priceField.lang !== locale ? priceField.lang : undefined }
      : signup?.priceNok
        ? { value: `${signup.priceNok} kr`, lang: undefined }
        : null;

  const closes = parseInstant(signup?.closes);
  const opens = parseInstant(signup?.opens);
  const seats = signup?.capacity ? ` · ${t('facts.capacity', { count: signup.capacity })}` : '';
  const signupLine: Record<typeof state, string> = {
    open:
      (closes
        ? t('redesign.signupOpenUntil', { date: formatDateTime(closes, locale) })
        : t('redesign.signupOpen')) + seats,
    notYetOpen:
      (opens
        ? t('signup.notYetOpen', { date: formatDateTime(opens, locale) })
        : t('redesign.signupSoon')) + seats,
    closed: t('signup.closed'),
    dropIn: t('signup.dropIn'),
    none: t('signup.dropIn'),
  };
  // On a drop-in event the editor's note («Gratis for alle») says it better than the default.
  const signupText = dropIn && note ? note.value : signupLine[state];
  const signupLang = dropIn && note && note.lang !== locale ? note.lang : undefined;

  const directions = pickLocale(event.venue?.directions, locale);
  const meetingPoint = pickLocale(event.venue?.meetingPoint, locale);
  const accessibility = pickLocale(event.venue?.accessibility, locale);
  const links = (event.links ?? []).filter((link) => safeExternalUrl(link.url));
  const hasDetails =
    !!meetingPoint ||
    !!directions ||
    !!accessibility ||
    !!event.venue?.contact ||
    (!dropIn && !!note) ||
    (!priceInHero && !!priceText) ||
    links.length > 0;

  const ics: IcsEventInput = {
    title: event.title,
    description: event.content ? toPlainText(event.content) : undefined,
    location: mapQuery || undefined,
    start,
    end,
    url: window.location.href,
  };

  const calendarButton = (
    <Button
      variant={canSignUp || clubSignUp ? 'tertiary' : 'primary'}
      size="lg"
      icon="calendar"
      className={canSignUp || clubSignUp ? 'border-2 border-white max-sm:w-full' : 'max-sm:w-full'}
      onClick={() => downloadIcs(ics, `${event.title}.ics`)}
      aria-label={t('addEventToCalendar', { title: event.title })}
    >
      {t('addToCalendar')}
    </Button>
  );

  return (
    <div className="dark:bg-darkestblue bg-white">
      <EventHeroBand
        back={{ to: '/kalender', label: t('redesign.calendar') }}
        media={
          event.image ? (
            <div className="max-w-aside relative mx-auto w-full lg:mx-0 lg:ml-auto">
              <Polaroid>
                <HeroImage image={event.image} priority />
              </Polaroid>
              <DateStamp start={start} className="absolute -top-5 -left-3 sm:-left-6" />
            </div>
          ) : undefined
        }
      >
        <div className="flex flex-wrap items-center gap-3">
          <Eyebrow>{t(`redesign.category.${event.category}`)}</Eyebrow>
          {(past || locale === 'nb') && (
            <span className="font-heading text-sm font-bold text-white/80">
              {past ? t('redesign.past') : countdownLabel(start, now)}
            </span>
          )}
        </div>
        <h1 className="font-heading text-section font-extrabold" lang={nbLang}>
          {event.title}
        </h1>
        {event.frontPageNotice?.trim() && (
          <NoticeLine label={t('redesign.notice')}>{event.frontPageNotice.trim()}</NoticeLine>
        )}
        <div className="flex flex-col gap-2">
          <HeroFact icon={Clock}>
            <time dateTime={start.toISOString()}>
              {capitalise(formatDayLong(start, locale))}, {clockTime(start)}–{clockTime(end)}
            </time>
            {event.venue?.doorsOpen && (
              <HeroFactNote>{t('venue.doorsOpen', { time: event.venue.doorsOpen })}</HeroFactNote>
            )}
          </HeroFact>
          {place && (
            <HeroFact icon={Pin}>
              <span lang={nbLang}>{place}</span>
              {address && <HeroFactNote lang={nbLang}>{address}</HeroFactNote>}
              <a
                href={googleMapsUrl(mapQuery)}
                target="_blank"
                rel="noopener noreferrer"
                className="focus-visible:outline-focus-ring text-sm underline underline-offset-4 opacity-85 hover:opacity-100 focus-visible:outline-2"
              >
                {t('venue.showMap')}
              </a>
            </HeroFact>
          )}
          {heroPrice && (
            <HeroFact icon={Tag}>
              <span className="sr-only">{t('facts.price')}: </span>
              <span lang={heroPrice.lang}>{heroPrice.value}</span>
            </HeroFact>
          )}
          <HeroFact icon={Players}>
            <span lang={signupLang}>{signupText}</span>
          </HeroFact>
        </div>
        {!past && (
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {clubSignUp ? (
              <>
                <div className="max-sm:w-full max-sm:[&_button]:w-full">
                  <EventSignUp event={event} rsvp={rsvp} size="lg" />
                </div>
                {calendarButton}
              </>
            ) : (
              <>
                {canSignUp && (
                  <Button
                    variant="primary"
                    size="lg"
                    icon="right"
                    className="max-sm:w-full"
                    onClick={() => openExternal(signupUrl)}
                    lang={label && label.lang !== locale ? label.lang : undefined}
                  >
                    {label?.value ?? t('signup.default')}
                  </Button>
                )}
                {calendarButton}
              </>
            )}
          </div>
        )}
      </EventHeroBand>

      <div
        className={`max-w-shell text-darkestblue mx-auto grid gap-10 px-4 py-10 sm:px-6 lg:py-12 dark:text-white ${
          hasDetails ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : ''
        }`}
      >
        <div className="flex min-w-0 flex-col gap-6">
          <SectionHeading title={t('festival.about')} kicker={t('redesign.inShort')} />
          <div className="flex max-w-[68ch] flex-col gap-6 text-lg" lang={nbLang}>
            {event.content?.length ? (
              <div className="sbsk-rt">
                <PortableText value={event.content} components={components} />
              </div>
            ) : null}
            {event.programInfo?.length || event.schedule?.length ? (
              <section className="flex flex-col gap-2" aria-labelledby="program-heading">
                <h3 id="program-heading" className="font-heading text-h3 font-extrabold">
                  {t('program.title')}
                </h3>
                {event.schedule?.length ? (
                  <ol className="border-orange flex flex-col border-l-4">
                    {event.schedule.map((entry) => (
                      <li
                        key={entry._key}
                        className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-3 px-4 py-2"
                      >
                        <span className="font-heading font-extrabold whitespace-nowrap">
                          {timeRange(new Date(entry.startTime), new Date(entry.endTime), locale)}
                        </span>
                        <span className="font-body">
                          {entry.label}
                          {entry.location && entry.location !== place && (
                            <span className="opacity-80"> · {entry.location}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : null}
                {event.programInfo?.length ? (
                  <div className="sbsk-rt border-orange border-l-4 pl-4">
                    <PortableText value={event.programInfo} components={components} />
                  </div>
                ) : null}
              </section>
            ) : null}
          </div>
          <SponsorLine sponsors={sponsors} />
        </div>

        {hasDetails && (
          <aside className="lg:sticky lg:top-6 lg:self-start">
            <InfoCard title={t('redesign.goodToKnow')}>
              <InfoList>
                {!priceInHero && priceText && (
                  <InfoRow label={t('facts.price')} lang={nbLang}>
                    <div className="sbsk-rt">
                      <PortableText value={event.pricingInfo!} components={components} />
                    </div>
                  </InfoRow>
                )}
                {meetingPoint && (
                  <InfoRow
                    label={t('venue.title')}
                    lang={meetingPoint.lang !== locale ? meetingPoint.lang : undefined}
                  >
                    {meetingPoint.value}
                  </InfoRow>
                )}
                {!dropIn && note && (
                  <InfoRow
                    label={t('facts.signup')}
                    lang={note.lang !== locale ? note.lang : undefined}
                  >
                    {note.value}
                  </InfoRow>
                )}
                {directions && (
                  <InfoRow
                    label={t('venue.directions')}
                    lang={directions.lang !== locale ? directions.lang : undefined}
                  >
                    <div className="sbsk-rt">
                      <PortableText value={directions.value} components={components} />
                    </div>
                  </InfoRow>
                )}
                {accessibility && (
                  <InfoRow
                    label={t('venue.accessibility')}
                    lang={accessibility.lang !== locale ? accessibility.lang : undefined}
                  >
                    {accessibility.value}
                  </InfoRow>
                )}
                {event.venue?.contact && (
                  <InfoRow label={t('festival.contactTitle')}>{event.venue.contact}</InfoRow>
                )}
                {links.length > 0 && (
                  <InfoRow label={t('redesign.links')}>
                    {links.map((link) => (
                      <a
                        key={link.url}
                        href={safeExternalUrl(link.url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block underline underline-offset-2"
                      >
                        {link.label}
                      </a>
                    ))}
                  </InfoRow>
                )}
              </InfoList>
            </InfoCard>
          </aside>
        )}

        <RelatedPosts
          posts={event.relatedPosts}
          className={`print:hidden ${hasDetails ? 'lg:col-span-2' : ''}`}
        />
      </div>
    </div>
  );
}
