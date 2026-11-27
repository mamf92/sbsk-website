import * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { PortableText } from '@portabletext/react';
import { Carousel } from '../../ui/Carousel';
import type { EventFact } from '../../ui/EventFacts';
import { EventHero } from '../../ui/EventHero';
import { EventKeyInfo } from '../../ui/EventKeyInfo';
import { EventPageLayout } from '../../ui/EventPageLayout';
import { EventScheduleCard } from '../../ui/EventScheduleCard';
import { Panel } from '../../ui/Panel';
import { Link, linkClassesInherit } from '../../ui/Link';
import { SignupBlock } from '../../ui/SignupBlock';
import { SponsorGrid, SponsorStrip } from '../../ui/Sponsors';
import { RelatedPosts } from '../../ui/RelatedPosts';
import { Tag } from '../../ui/Tag';
import { VenueCard } from '../../ui/VenueCard';
import { Program, DAY_PARAM } from './Program';
import { PrintProgram } from './PrintProgram';
import { useEventsT } from '../../../i18n';
import { pickLocale } from '../../../i18n/pickLocale';
import { useLocale, useTranslatedContent } from '../../../hooks/locale/useLocale';
import { components } from '../../../sanity/editors/portableTextComponents';
import type { FestivalTypes } from '../../../sanity/queryHelpers/festivals';
import type { LocaleBlock } from '../../../sanity/queryHelpers/fragments';
import type { SanityImageValue } from '../../ui/SanityImage';
import {
  dayOfMonth,
  formatDateTime,
  formatDayLong,
  monthAbbreviation,
  parseInstant,
} from '../../../utils/eventDateFormat';
import {
  festivalDate,
  festivalDateLabel,
  festivalDayIcs,
  scheduledSessions,
} from '../../../utils/festival';
import { safeLinkUrl } from '../../../utils/safeUrl';
import { signupState } from '../../../utils/signup';
import { redesignEnabled } from '../../../utils/featureFlags';
import { FestivalPageRedesign } from '../redesign/FestivalPageRedesign';

const SITE = 'Stavanger Brettspillklubb';
const h2 = 'font-heading text-h3 font-bold';
/** A section that opens with its own heading on the page background, not a panel: the extra
 *  top space separates it from the block above without the old 40px gaps everywhere. */
const headed = 'pt-4';

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
 * A festival over several days with its own programme: Board Game Masters. One page from hero
 * to contact, built from the same primitives as a single event, so a later reskin reaches both.
 */
export default function FestivalPage({ festival }: { festival: FestivalTypes }) {
  // The new design only in the /redesign/ preview build (`VITE_ENABLE_REDESIGN`).
  if (redesignEnabled) return <FestivalPageRedesign festival={festival} />;
  return <FestivalPageCurrent festival={festival} />;
}

function FestivalPageCurrent({ festival }: { festival: FestivalTypes }) {
  useTranslatedContent();
  const t = useEventsT();
  const { locale } = useLocale();
  const langOf = (lang?: string) => (lang && lang !== locale ? lang : undefined);
  const now = new Date();

  const title = pickLocale(festival.title, locale);
  const titleText = title?.value ?? 'Board Game Masters';
  const tagline = pickLocale(festival.tagline, locale);
  const days = festival.days ?? [];
  const sponsors = festival.sponsors ?? [];
  const price = pickLocale(festival.signup?.price, locale);
  const state = signupState(festival.signup, now);
  const contact = festival.contactEmail ? safeLinkUrl(`mailto:${festival.contactEmail}`) : null;
  const hasOwnSignups = days.some(
    (day) => day.signup || (day.sessions ?? []).some((session) => session.signup),
  );

  React.useEffect(() => {
    document.title = `${titleText} · ${SITE}`;
    return () => {
      document.title = SITE;
    };
  }, [titleText]);

  const dateRange = festivalDateLabel(festival.startDate, festival.endDate, locale);

  const opens = parseInstant(festival.signup?.opens);
  const signupFact = {
    open: t('facts.signupOpen'),
    notYetOpen: opens ? t('facts.signupNotYetOpen', { date: formatDateTime(opens, locale) }) : null,
    closed: t('facts.signupClosed'),
    dropIn: t('facts.signupDropIn'),
    none: null,
  }[state];

  const facts: EventFact[] = [
    ...(dateRange ? [{ id: 'when', label: t('facts.when'), value: dateRange }] : []),
    ...(festival.venue?.name
      ? [
          {
            id: 'where',
            label: t('facts.where'),
            value: <span lang={langOf('nb')}>{festival.venue.name}</span>,
          },
        ]
      : []),
    ...(festival.venue?.doorsOpen
      ? [{ id: 'doors', label: t('facts.doors'), value: festival.venue.doorsOpen }]
      : []),
    ...(price
      ? [
          {
            id: 'price',
            label: t('facts.price'),
            value: <span lang={langOf(price.lang)}>{price.value}</span>,
          },
        ]
      : []),
    ...(signupFact ? [{ id: 'signup', label: t('facts.signup'), value: signupFact }] : []),
  ];

  const elsewhere = days.filter(
    (day) => day.venue?.name && day.venue.name !== festival.venue?.name,
  );
  const faq = (festival.faq ?? []).filter((item) => pickLocale(item.question, locale));
  const gallery = (festival.gallery ?? []) as SanityImageValue[];

  const venueLabel = festival.venue?.name;
  const hasPricing = !!pickLocale(festival.pricing, locale) || state !== 'none';
  const hasRules = !!pickLocale(festival.rules, locale);

  const keyInfo = (
    <EventKeyInfo
      label={t('keyInfo')}
      facts={facts}
      actions={
        <>
          <SignupBlock signup={festival.signup} now={now} />
          {hasOwnSignups && <p className="font-body text-sm">{t('festival.perDaySignup')}</p>}
          {days.length > 0 && (
            <RouterLink
              to={{ hash: '#program' }}
              preventScrollReset
              className={`${linkClassesInherit} font-body underline`}
            >
              {t('festival.seeProgram')}
            </RouterLink>
          )}
        </>
      }
    />
  );

  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white pb-16 dark:text-white print:bg-white print:text-black">
      <div className="max-w-shell gap-stack mx-auto flex w-full flex-col px-3 pt-4 sm:px-6">
        <div className="flex flex-col gap-0">
          <EventHero
            image={festival.heroImage}
            title={titleText}
            titleLang={langOf(title?.lang)}
            kicker={festival.edition ? <Tag tone="orange">{festival.edition}</Tag> : undefined}
            lead={tagline?.value}
            leadLang={langOf(tagline?.lang)}
            meta={
              dateRange || venueLabel ? (
                <>
                  {dateRange}
                  {dateRange && venueLabel && ' · '}
                  {venueLabel && <span lang={langOf('nb')}>{venueLabel}</span>}
                </>
              ) : undefined
            }
          />
          <SponsorStrip sponsors={sponsors} className="print:hidden" />
        </div>

        <EventPageLayout aside={keyInfo}>
          {pickLocale(festival.intro, locale) && (
            <Panel title={t('festival.about')} className="print:hidden">
              <LocaleRichText value={festival.intro} />
            </Panel>
          )}

          {/* One dated card per day, as in the Figma design. Shown for a single day too: a
              day's own sign-up and opening hours live only here. */}
          {days.length > 0 && (
            <section
              aria-labelledby="days-heading"
              className={`flex flex-col gap-3 print:hidden ${headed}`}
            >
              <h2 id="days-heading" className="font-heading text-h2 font-bold">
                {t('festival.days')}
              </h2>
              <ul className="gap-stack flex flex-col">
                {days.map((day, index) => {
                  const date = festivalDate(day.date);
                  const dayName = formatDayLong(date, locale);
                  const label = pickLocale(day.label, locale);
                  const summary = pickLocale(day.summary, locale);
                  // Same rule as the programme: a session without both times is not shown yet.
                  const count = scheduledSessions(day).length;
                  const place = day.venue?.name ?? venueLabel;
                  const dayTitle = label?.value ?? t('festival.dayN', { n: index + 1 });
                  const meta = [
                    dayName.charAt(0).toUpperCase() + dayName.slice(1),
                    day.opens && day.closes ? `${day.opens}–${day.closes}` : null,
                    place,
                  ]
                    .filter(Boolean)
                    .join(' · ');
                  const ics = festivalDayIcs(
                    festival,
                    day,
                    `${titleText} · ${dayTitle}`,
                    window.location.href,
                  );
                  return (
                    <li key={day._key}>
                      <EventScheduleCard
                        size="lg"
                        day={`${dayOfMonth(date)}.`}
                        month={monthAbbreviation(date, locale)}
                        title={dayTitle}
                        lang={label ? langOf(label.lang) : undefined}
                        meta={meta}
                        ics={ics}
                        addLabel={t('addEventToCalendar', { title: dayTitle })}
                      >
                        {summary && (
                          <p className="font-body text-sm" lang={langOf(summary.lang)}>
                            {summary.value}
                          </p>
                        )}
                        <SignupBlock signup={day.signup} now={now} compact />
                        <RouterLink
                          to={{ search: `?${DAY_PARAM}=${index + 1}`, hash: '#program' }}
                          className={`${linkClassesInherit} font-body text-sm underline`}
                          preventScrollReset
                        >
                          {count > 0
                            ? `${t('program.seeDay', { day: dayName })} (${t('program.sessions', { count })})`
                            : t('program.seeDay', { day: dayName })}
                        </RouterLink>
                      </EventScheduleCard>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          <div className={headed}>
            <Program festival={festival} />
          </div>
          {days.length > 0 && <PrintProgram festival={festival} />}

          {(hasPricing || hasRules) && (
            <div
              className={`gap-stack grid grid-cols-1 print:hidden ${hasPricing && hasRules ? 'md:grid-cols-2' : ''}`}
            >
              {hasPricing && (
                <Panel title={t('festival.signupAndPrices')}>
                  <LocaleRichText value={festival.pricing} />
                  <SignupBlock signup={festival.signup} now={now} compact />
                </Panel>
              )}
              {hasRules && (
                <Panel title={t('festival.rules')}>
                  <LocaleRichText value={festival.rules} />
                </Panel>
              )}
            </div>
          )}

          <VenueCard venue={festival.venue} className="print:hidden" inKeyFacts />
          {elsewhere.map((day) => (
            <VenueCard
              key={day._key}
              venue={day.venue}
              className="print:hidden"
              title={t('festival.elsewhere', {
                day: formatDayLong(festivalDate(day.date), locale),
              })}
            />
          ))}

          {faq.length > 0 && (
            <section
              className={`flex flex-col gap-2 print:hidden ${headed}`}
              aria-labelledby="faq-heading"
            >
              <h2 id="faq-heading" className={h2}>
                {t('faq')}
              </h2>
              {faq.map((item) => {
                const question = pickLocale(item.question, locale)!;
                return (
                  <details
                    key={item._key}
                    className="font-body border border-black p-4 dark:border-white"
                  >
                    <summary
                      className="focus-visible:outline-focus-ring cursor-pointer font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
                      lang={langOf(question.lang)}
                    >
                      {question.value}
                    </summary>
                    <div className="pt-3">
                      <LocaleRichText value={item.answer} />
                    </div>
                  </details>
                );
              })}
            </section>
          )}

          <SponsorGrid sponsors={sponsors} className={`print:hidden ${headed}`} />

          {gallery.length > 0 && (
            <section
              className={`flex flex-col gap-3 print:hidden ${headed}`}
              aria-labelledby="gallery-heading"
            >
              <h2 id="gallery-heading" className={h2}>
                {t('festival.gallery')}
              </h2>
              <Carousel images={gallery} label={t('festival.gallery')} />
            </section>
          )}

          <RelatedPosts posts={festival.relatedPosts} className={`print:hidden ${headed}`} />

          {contact && (
            <section
              className={`font-body flex flex-col gap-2 ${headed}`}
              aria-labelledby="contact-heading"
            >
              <h2 id="contact-heading" className={h2}>
                {t('festival.contactTitle')}
              </h2>
              <p>
                {t('festival.contactLead')}{' '}
                <Link href={contact} className="underline">
                  {festival.contactEmail}
                </Link>
              </p>
            </section>
          )}
        </EventPageLayout>
      </div>
    </div>
  );
}
