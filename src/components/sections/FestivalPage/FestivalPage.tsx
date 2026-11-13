import * as React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { PortableText } from '@portabletext/react';
import { Carousel } from '../../ui/Carousel';
import { EventFacts, type EventFact } from '../../ui/EventFacts';
import { HeroImage } from '../../ui/HeroImage';
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
import { formatDateTime, formatDayLong, parseInstant } from '../../../utils/eventDateFormat';
import { festivalDate, festivalDateLabel } from '../../../utils/festival';
import { safeLinkUrl } from '../../../utils/safeUrl';
import { signupState } from '../../../utils/signup';

const SITE = 'Stavanger Brettspillklubb';
const panel = 'bg-darkblue font-body flex flex-col gap-4 p-6 text-white sm:p-8';
const h2 = 'font-heading text-h3 font-bold';

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

  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white pb-16 dark:text-white print:bg-white print:text-black">
      {/* Hero */}
      <section className="bg-darkblue surface-dark relative isolate text-white print:bg-white print:text-black">
        <div className="absolute inset-0 -z-10 print:hidden">
          <HeroImage image={festival.heroImage} priority />
          <div className="bg-darkestblue/70 absolute inset-0" />
        </div>
        <div className="max-w-content content-gutter:px-0 mx-auto flex flex-col items-start gap-4 px-3 py-12 sm:py-16">
          {festival.edition && <Tag tone="orange">{festival.edition}</Tag>}
          <h1
            className="font-heading text-h1 tracking-heading font-bold"
            lang={langOf(title?.lang)}
          >
            {titleText}
          </h1>
          {tagline && (
            <p className="font-body max-w-form text-lg" lang={langOf(tagline.lang)}>
              {tagline.value}
            </p>
          )}
          {(dateRange || festival.venue?.name) && (
            <p className="font-body font-bold">
              {dateRange}
              {dateRange && festival.venue?.name && ' · '}
              {festival.venue?.name && <span lang={langOf('nb')}>{festival.venue.name}</span>}
            </p>
          )}
          <div className="flex flex-wrap items-start gap-4 print:hidden">
            <SignupBlock signup={festival.signup} now={now} />
            {days.length > 0 && (
              <RouterLink
                to={{ hash: '#program' }}
                preventScrollReset
                className={`${linkClassesInherit} self-center underline`}
              >
                {t('festival.seeProgram')}
              </RouterLink>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-content content-gutter:px-0 mx-auto flex w-full flex-col gap-10 px-3 pt-8">
        <SponsorStrip sponsors={sponsors} className="print:hidden" />

        <EventFacts facts={facts} className="print:hidden" />

        {/* Shown for a single day too: a day's own sign-up and opening hours live only here. */}
        {days.length > 0 && (
          <section aria-labelledby="days-heading" className="flex flex-col gap-4 print:hidden">
            <h2 id="days-heading" className={h2}>
              {t('festival.days')}
            </h2>
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {days.map((day, index) => {
                const dayName = formatDayLong(festivalDate(day.date), locale);
                const label = pickLocale(day.label, locale);
                const summary = pickLocale(day.summary, locale);
                // Same rule as the programme: a session without both times is not shown yet.
                const count = (day.sessions ?? []).filter((s) => s.start && s.end).length;
                return (
                  <li key={day._key} className={`${panel} gap-2`}>
                    <h3 className="font-heading text-h4 font-bold first-letter:uppercase">
                      {dayName}
                    </h3>
                    {label && (
                      <p className="font-bold" lang={langOf(label.lang)}>
                        {label.value}
                      </p>
                    )}
                    {day.opens && day.closes && (
                      <p className="text-sm">
                        {t('festival.doors', { opens: day.opens, closes: day.closes })}
                      </p>
                    )}
                    {summary && (
                      <p className="line-clamp-2 text-sm" lang={langOf(summary.lang)}>
                        {summary.value}
                      </p>
                    )}
                    {count > 0 && <p className="text-sm">{t('program.sessions', { count })}</p>}
                    <SignupBlock signup={day.signup} now={now} compact />
                    <RouterLink
                      to={{ search: `?${DAY_PARAM}=${index + 1}`, hash: '#program' }}
                      className={`${linkClassesInherit} mt-auto underline`}
                      preventScrollReset
                    >
                      {t('program.seeDay', { day: dayName })}
                    </RouterLink>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <Program festival={festival} />
        {days.length > 0 && <PrintProgram festival={festival} />}

        {pickLocale(festival.intro, locale) && (
          <section className={`${panel} print:hidden`} aria-labelledby="about-heading">
            <h2 id="about-heading" className={h2}>
              {t('festival.about')}
            </h2>
            <LocaleRichText value={festival.intro} />
          </section>
        )}

        {(pickLocale(festival.pricing, locale) || state !== 'none') && (
          <section className={`${panel} print:hidden`} aria-labelledby="signup-heading">
            <h2 id="signup-heading" className={h2}>
              {t('festival.signupAndPrices')}
            </h2>
            <LocaleRichText value={festival.pricing} />
            <SignupBlock signup={festival.signup} now={now} />
            {hasOwnSignups && <p className="text-sm">{t('festival.perDaySignup')}</p>}
          </section>
        )}

        <VenueCard venue={festival.venue} className="print:hidden" />
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

        {pickLocale(festival.rules, locale) && (
          <section className={`${panel} print:hidden`} aria-labelledby="rules-heading">
            <h2 id="rules-heading" className={h2}>
              {t('festival.rules')}
            </h2>
            <LocaleRichText value={festival.rules} />
          </section>
        )}

        {faq.length > 0 && (
          <section className="flex flex-col gap-3 print:hidden" aria-labelledby="faq-heading">
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

        <SponsorGrid sponsors={sponsors} className="print:hidden" />

        {gallery.length > 0 && (
          <section className="flex flex-col gap-4 print:hidden" aria-labelledby="gallery-heading">
            <h2 id="gallery-heading" className={h2}>
              {t('festival.gallery')}
            </h2>
            <Carousel images={gallery} label={t('festival.gallery')} />
          </section>
        )}

        <RelatedPosts posts={festival.relatedPosts} className="print:hidden" />

        {contact && (
          <section className="font-body flex flex-col gap-2" aria-labelledby="contact-heading">
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
      </div>
    </div>
  );
}
