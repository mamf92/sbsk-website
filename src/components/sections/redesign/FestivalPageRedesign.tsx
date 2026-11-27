import * as React from 'react';
import { PortableText } from '@portabletext/react';
import { EventHeroBand } from '../../ui/EventHeroBand';
import { HeroFact, HeroFactNote } from '../../ui/HeroFact';
import { InfoCard, InfoList, InfoRow } from '../../ui/InfoCard';
import { Eyebrow } from '../../ui/Eyebrow';
import { Button } from '../../ui/Buttons';
import { buttonClasses } from '../../ui/buttonClasses';
import { HeroImage } from '../../ui/HeroImage';
import { Polaroid } from '../../ui/Polaroid';
import { SectionHeading } from '../../ui/SectionHeading';
import { SponsorLine } from '../../ui/Sponsors';
import { RelatedPosts } from '../../ui/RelatedPosts';
import { Link } from '../../ui/Link';
import { FestivalProgram } from './FestivalProgram';
import { PrintProgram } from '../FestivalPage/PrintProgram';
import { useEventsT } from '../../../i18n';
import { pickLocale } from '../../../i18n/pickLocale';
import { useLocale, useTranslatedContent } from '../../../hooks/locale/useLocale';
import { components } from '../../../sanity/editors/portableTextComponents';
import { urlFor } from '../../../sanity/sanityImageUrl';
import type { FestivalTypes } from '../../../sanity/queryHelpers/festivals';
import type { LocaleBlock } from '../../../sanity/queryHelpers/fragments';
import { countdownLabel } from '../../../utils/eventHighlights';
import { formatDateTime, osloDateKey, parseInstant } from '../../../utils/eventDateFormat';
import {
  festivalDate,
  festivalDateLabel,
  festivalIcs,
  scheduledSessions,
} from '../../../utils/festival';
import { downloadIcs } from '../../../utils/ics';
import { googleMapsUrl } from '../../../utils/mapUrl';
import { openExternal, safeExternalUrl, safeLinkUrl } from '../../../utils/safeUrl';
import { signupState } from '../../../utils/signup';
import Clock from '../../../assets/icons/symbols/clock.svg?react';
import Pin from '../../../assets/icons/symbols/locationpin.svg?react';
import Players from '../../../assets/icons/symbols/players.svg?react';
import TagIcon from '../../../assets/icons/symbols/tag.svg?react';

const SITE = 'Stavanger Brettspillklubb';
const capitalise = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/** Portable Text in the visitor's language, marked with its own when it fell back. */
function LocaleRichText({ value }: { value: LocaleBlock | undefined }) {
  const { locale } = useLocale();
  const picked = pickLocale(value, locale);
  if (!picked) return null;
  return (
    <div className="sbsk-rt" lang={picked.lang !== locale ? picked.lang : undefined}>
      <PortableText value={picked.value} components={components} />
    </div>
  );
}

/**
 * A festival over several days (Board Game Masters) in the new design (`redesignEnabled`). The
 * hero gives the dates, place, sign-up and one main button next to the festival's poster; «Om»
 * and the prices sit side by side; the days and the programme are one block; rules and
 * questions side by side; then the photos. Every fact shows once.
 */
export function FestivalPageRedesign({ festival }: { festival: FestivalTypes }) {
  useTranslatedContent();
  const t = useEventsT();
  const { locale } = useLocale();
  const langOf = (lang?: string) => (lang && lang !== locale ? lang : undefined);
  const nbLang = langOf('nb');
  const now = new Date();

  const title = pickLocale(festival.title, locale);
  const titleText = title?.value ?? 'Board Game Masters';
  const tagline = pickLocale(festival.tagline, locale);
  const days = festival.days ?? [];
  const sponsors = festival.sponsors ?? [];
  const faq = (festival.faq ?? []).filter((item) => pickLocale(item.question, locale));
  const gallery = festival.gallery ?? [];
  const hasProgramme = days.some((day) => scheduledSessions(day).length > 0);
  const hasRules = !!pickLocale(festival.rules, locale);
  const hasPricing = !!pickLocale(festival.pricing, locale);
  const contact = festival.contactEmail ? safeLinkUrl(`mailto:${festival.contactEmail}`) : null;
  const venue = festival.venue;
  const mapQuery = [venue?.name, venue?.address ?? (venue?.name ? 'Stavanger' : undefined)]
    .filter(Boolean)
    .join(', ');
  const dateRange = festivalDateLabel(festival.startDate, festival.endDate, locale);
  const start = festival.startDate ? festivalDate(festival.startDate) : null;
  const past = !!festival.endDate && festival.endDate < osloDateKey(now);

  const signup = festival.signup;
  const state = signupState(signup, now);
  const signupUrl = safeExternalUrl(signup?.url);
  const signupOpen = state === 'open' && !!signupUrl;
  const label = pickLocale(signup?.label, locale);
  const price = pickLocale(signup?.price, locale);
  const opens = parseInstant(signup?.opens);
  const closes = parseInstant(signup?.closes);
  const hasOwnSignups = days.some(
    (day) => day.signup || (day.sessions ?? []).some((session) => session.signup),
  );
  const status = {
    open: closes
      ? t('redesign.signupOpenUntil', { date: formatDateTime(closes, locale) })
      : t('redesign.signupOpen'),
    notYetOpen: opens
      ? t('signup.notYetOpen', { date: formatDateTime(opens, locale) })
      : t('redesign.signupSoon'),
    closed: t('signup.closed'),
    dropIn: t('signup.dropIn'),
    none: hasOwnSignups ? t('festival.perDaySignup') : t('redesign.signupComing'),
  }[state];

  const meetingPoint = pickLocale(venue?.meetingPoint, locale);
  const directions = pickLocale(venue?.directions, locale);
  const accessibility = pickLocale(venue?.accessibility, locale);
  const hasVenueDetails = !!(meetingPoint || directions || accessibility || venue?.contact);

  React.useEffect(() => {
    document.title = `${titleText} · ${SITE}`;
    return () => {
      document.title = SITE;
    };
  }, [titleText]);

  const wholeFestival = () =>
    downloadIcs(festivalIcs(festival, locale, window.location.href), `${festival.slug}.ics`);
  const outline = 'border-2 border-white max-sm:w-full';

  return (
    <div className="dark:bg-darkestblue bg-white print:bg-white print:text-black">
      <div className="print:hidden">
        <EventHeroBand
          back={{ to: '/kalender', label: t('redesign.calendar') }}
          wideMedia
          media={
            festival.heroImage ? (
              <div className="aspect-video overflow-hidden border-2 border-black shadow-[10px_10px_0_var(--color-darkestblue)]">
                <HeroImage image={festival.heroImage} priority />
              </div>
            ) : undefined
          }
        >
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>
              {festival.series === 'bgm'
                ? t('redesign.category.bgm')
                : t('redesign.festivalCategory')}
              {festival.edition ? ` · ${festival.edition}` : ''}
            </Eyebrow>
            {start && (past || locale === 'nb') && (
              <span className="font-heading text-sm font-bold text-white/80">
                {past ? t('redesign.past') : countdownLabel(start, now)}
              </span>
            )}
          </div>
          <h1 className="font-heading text-section font-extrabold" lang={langOf(title?.lang)}>
            {titleText}
          </h1>
          {tagline && (
            <p className="font-body max-w-[52ch] text-lg text-white/90" lang={langOf(tagline.lang)}>
              {tagline.value}
            </p>
          )}
          <div className="flex flex-col gap-2">
            {dateRange && <HeroFact icon={Clock}>{capitalise(dateRange)}</HeroFact>}
            {venue?.name && (
              <HeroFact icon={Pin}>
                <span lang={nbLang}>{venue.name}</span>
                {venue.address && <HeroFactNote lang={nbLang}>{venue.address}</HeroFactNote>}
                {venue.doorsOpen && (
                  <HeroFactNote>{t('venue.doorsOpen', { time: venue.doorsOpen })}</HeroFactNote>
                )}
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
            {price && !hasPricing && (
              <HeroFact icon={TagIcon}>
                <span className="sr-only">{t('facts.price')}: </span>
                <span lang={langOf(price.lang)}>{price.value}</span>
              </HeroFact>
            )}
            <HeroFact icon={Players}>{status}</HeroFact>
          </div>
          {!past && (
            <div className="flex flex-wrap gap-3 pt-2">
              {signupOpen && (
                <Button
                  variant="primary"
                  size="lg"
                  icon="right"
                  className="max-sm:w-full"
                  onClick={() => openExternal(signupUrl)}
                  lang={langOf(label?.lang)}
                >
                  {label?.value ?? t('signup.default')}
                </Button>
              )}
              {hasProgramme && (
                <a
                  href="#program"
                  className={buttonClasses({
                    variant: signupOpen ? 'tertiary' : 'primary',
                    size: 'lg',
                    className: signupOpen ? outline : 'max-sm:w-full',
                  })}
                >
                  {t('festival.seeProgram')}
                </a>
              )}
              {!(signupOpen && hasProgramme) && (
                <Button
                  variant={signupOpen || hasProgramme ? 'tertiary' : 'primary'}
                  size="lg"
                  icon="calendar"
                  className={signupOpen || hasProgramme ? outline : 'max-sm:w-full'}
                  onClick={wholeFestival}
                  aria-label={t('redesign.festivalWhole')}
                >
                  {t('addToCalendar')}
                </Button>
              )}
            </div>
          )}
        </EventHeroBand>
      </div>

      {(pickLocale(festival.intro, locale) ||
        hasPricing ||
        hasVenueDetails ||
        sponsors.length > 0) && (
        <section
          className={`max-w-shell text-darkestblue mx-auto grid gap-10 px-4 py-10 sm:px-6 lg:py-12 dark:text-white print:hidden ${
            hasPricing || hasVenueDetails ? 'lg:grid-cols-[minmax(0,1fr)_22rem]' : ''
          }`}
        >
          <div className="flex min-w-0 flex-col gap-4">
            <SectionHeading
              title={t('redesign.about', { name: titleText })}
              kicker={t('redesign.inShort')}
            />
            <div className="max-w-[68ch] text-lg">
              <LocaleRichText value={festival.intro} />
            </div>
            <SponsorLine sponsors={sponsors} />
          </div>
          {(hasPricing || hasVenueDetails) && (
            <aside className="flex flex-col gap-8 lg:pt-2">
              {hasPricing && (
                <InfoCard
                  title={t('festival.signupAndPrices')}
                  icon={<TagIcon aria-hidden="true" className="h-5 w-5 fill-current" />}
                >
                  <LocaleRichText value={festival.pricing} />
                </InfoCard>
              )}
              {hasVenueDetails && (
                <InfoCard title={t('redesign.goodToKnow')}>
                  <InfoList>
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
                    {venue?.contact && (
                      <InfoRow label={t('festival.contactTitle')}>{venue.contact}</InfoRow>
                    )}
                  </InfoList>
                </InfoCard>
              )}
            </aside>
          )}
        </section>
      )}

      {days.length > 0 && <FestivalProgram festival={festival} />}
      {hasProgramme && (
        <div className="max-w-shell mx-auto px-4">
          <PrintProgram festival={festival} />
        </div>
      )}

      {(hasRules || faq.length > 0 || contact) && (
        <section
          className={`max-w-shell text-darkestblue mx-auto grid gap-10 px-4 py-10 sm:px-6 lg:py-12 dark:text-white print:hidden ${
            hasRules && (faq.length > 0 || contact) ? 'lg:grid-cols-2' : ''
          }`}
        >
          {hasRules && (
            <div className="flex flex-col gap-4">
              <SectionHeading title={t('redesign.howItWorks')} kicker={t('festival.rules')} />
              <LocaleRichText value={festival.rules} />
            </div>
          )}
          {(faq.length > 0 || contact) && (
            <div className="max-w-content flex flex-col gap-4">
              {faq.length > 0 && (
                <>
                  <SectionHeading
                    title={t('faq')}
                    kicker={t('redesign.questions', { count: faq.length })}
                  />
                  <div className="flex flex-col gap-3">
                    {faq.map((item) => {
                      const question = pickLocale(item.question, locale)!;
                      return (
                        <details
                          key={item._key}
                          className="group dark:bg-darkblue border border-black bg-white p-4 shadow-[4px_4px_0_var(--color-darkestblue)] dark:border-white dark:shadow-[4px_4px_0_black]"
                        >
                          <summary
                            className="font-heading focus-visible:outline-focus-ring flex cursor-pointer list-none items-center justify-between gap-3 font-bold focus-visible:outline-2 focus-visible:outline-offset-2 [&::-webkit-details-marker]:hidden"
                            lang={langOf(question.lang)}
                          >
                            {question.value}
                            <span
                              aria-hidden="true"
                              className="text-xl leading-none transition-transform group-open:rotate-45"
                            >
                              +
                            </span>
                          </summary>
                          <div className="font-body pt-3">
                            <LocaleRichText value={item.answer} />
                          </div>
                        </details>
                      );
                    })}
                  </div>
                </>
              )}
              {contact && (
                <p className="font-body">
                  {t('redesign.faqContact')}{' '}
                  <Link href={contact} className="underline">
                    {festival.contactEmail}
                  </Link>
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {gallery.length > 0 && (
        <section
          aria-labelledby="gallery-heading"
          className="bg-darkblue surface-dark dot-pattern text-white print:hidden"
        >
          <div className="max-w-shell mx-auto flex flex-col gap-8 px-4 py-10 sm:px-6 lg:py-12">
            <SectionHeading
              id="gallery-heading"
              title={t('festival.gallery')}
              kicker={t('redesign.galleryKicker')}
              invert
            />
            <ul
              className={`grid gap-10 sm:grid-cols-2 ${gallery.length >= 3 ? 'lg:grid-cols-3' : ''}`}
            >
              {gallery.map((image) => (
                <li key={image._key}>
                  <figure className="flex flex-col gap-4">
                    <Polaroid>
                      <img
                        src={urlFor(image).width(900).height(675).fit('crop').auto('format').url()}
                        // The caption below says what the photo shows.
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </Polaroid>
                    {image.alt && (
                      <figcaption className="font-body text-sm text-white/85" lang={nbLang}>
                        {image.alt}
                      </figcaption>
                    )}
                  </figure>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {festival.relatedPosts?.length ? (
        <div className="max-w-shell mx-auto px-4 py-10 sm:px-6 print:hidden">
          <RelatedPosts posts={festival.relatedPosts} />
        </div>
      ) : null}
    </div>
  );
}
