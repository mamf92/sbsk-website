import { Link as RouterLink, useLoaderData } from 'react-router-dom';
import { PortableText, toPlainText } from '@portabletext/react';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { urlFor } from '../sanity/sanityImageUrl';
import { components } from '../sanity/editors/portableTextComponents';
import { EventScheduleCard, type EventScheduleCardTone } from '../components/ui/EventScheduleCard';
import { EventFacts, type EventFact } from '../components/ui/EventFacts';
import { SignupBlock } from '../components/ui/SignupBlock';
import { SponsorGrid, SponsorStrip } from '../components/ui/Sponsors';
import { VenueCard } from '../components/ui/VenueCard';
import { linkClassesInherit } from '../components/ui/Link';
import {
  dayLabel,
  formatDateTime,
  formatDateTimeRange,
  monthAbbreviation,
  parseInstant,
  timeRange,
} from '../utils/eventDateFormat';
import { signupState } from '../utils/signup';
import { useEventsT } from '../i18n';
import { pickLocale } from '../i18n/pickLocale';
import { useLocale } from '../hooks/locale/useLocale';

/**
 * One template for every event that has `hasDetailPage` set, from a biweekly spillkveld with
 * nothing but a title and a description to a multi-day tournament — every section below is
 * conditional on the data actually being there, so a small event simply renders fewer of them.
 *
 * Page chrome is translated; the event's own title and texts are Norwegian-only fields, so in
 * English they carry `lang="nb"`.
 */
export default function SingleEventPage() {
  const { event } = useLoaderData() as { event: CalendarEventTypes };
  const t = useEventsT();
  const { locale } = useLocale();
  const nbLang = locale === 'nb' ? undefined : 'nb';

  const start = new Date(event.eventStartTime);
  const end = new Date(event.eventEndTime);
  const tone: EventScheduleCardTone = event.category === 'spillkveld' ? 'blue' : 'orange';
  const now = new Date();

  const hasContent = !!event.content?.length;
  const hasPricing = !!event.pricingInfo?.length;
  const hasProgram = !!event.programInfo?.length;
  const sponsors = event.showSponsors ? (event.sponsors ?? []) : [];
  const hasSchedule = !!event.schedule?.length;
  const place = event.venue?.name ?? event.location;
  const price = pickLocale(event.signup?.price, locale);
  const state = signupState(event.signup, now);

  const opens = parseInstant(event.signup?.opens);
  const signupFact: Record<typeof state, string | null> = {
    open: t('facts.signupOpen'),
    notYetOpen: opens ? t('facts.signupNotYetOpen', { date: formatDateTime(opens, locale) }) : null,
    closed: t('facts.signupClosed'),
    dropIn: t('facts.signupDropIn'),
    none: null,
  };

  const facts: EventFact[] = [
    {
      id: 'when',
      label: t('facts.when'),
      value: <time dateTime={start.toISOString()}>{formatDateTimeRange(start, end, locale)}</time>,
    },
    ...(place
      ? [{ id: 'where', label: t('facts.where'), value: <span lang={nbLang}>{place}</span> }]
      : []),
    ...(price
      ? [
          {
            id: 'price',
            label: t('facts.price'),
            value: <span lang={price.lang !== locale ? price.lang : undefined}>{price.value}</span>,
          },
        ]
      : []),
    ...(signupFact[state]
      ? [{ id: 'signup', label: t('facts.signup'), value: signupFact[state] }]
      : []),
  ];

  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white pb-16 dark:text-white">
      <div className="max-w-content content-gutter:px-0 mx-auto flex w-full flex-col gap-8 px-3 pt-6">
        <RouterLink to="/kalender" className={`${linkClassesInherit} w-fit underline`}>
          ← {t('back')}
        </RouterLink>

        <div className="flex flex-col gap-0">
          <div className="bg-darkblue flex flex-col gap-2 p-4 text-white sm:p-6">
            <span className="font-heading text-orange text-xs font-bold tracking-[0.14em] uppercase">
              {t('kicker')}
            </span>
            <h1 className="font-heading text-h1 tracking-heading font-bold" lang={nbLang}>
              {event.title}
            </h1>
          </div>
          <EventFacts facts={facts} className="border-t border-white/20" />
        </div>

        {event.image && (
          <img
            src={urlFor(event.image).width(1440).fit('crop').auto('format').url()}
            srcSet={[
              `${urlFor(event.image).width(400).fit('crop').auto('format').url()} 400w`,
              `${urlFor(event.image).width(800).fit('crop').auto('format').url()} 800w`,
              `${urlFor(event.image).width(1024).fit('crop').auto('format').url()} 1024w`,
            ].join(', ')}
            sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1024px"
            alt=""
            className="aspect-video w-full object-cover"
          />
        )}

        <SignupBlock signup={event.signup} now={now} />

        <SponsorStrip sponsors={sponsors} />

        {hasContent && (
          <div className="bg-darkblue p-6 text-white sm:p-8" lang={nbLang}>
            <div className="sbsk-rt">
              <PortableText value={event.content!} components={components} />
            </div>
          </div>
        )}

        <EventScheduleCard
          day={dayLabel(start, end)}
          month={monthAbbreviation(start)}
          title={event.title}
          meta={`${timeRange(start, end)}${event.location ? ` · ${event.location}` : ''}`}
          tone={tone}
          ics={{
            title: event.title,
            description: event.content ? toPlainText(event.content) : undefined,
            location: event.venue?.address ?? event.location,
            start,
            end,
            url: window.location.href,
          }}
        />

        {(hasPricing || hasProgram) && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {hasPricing && (
              <div className="bg-darkblue flex flex-col gap-3 p-6 text-white">
                <h2 className="font-heading text-h3 font-bold">{t('pricing')}</h2>
                <div className="sbsk-rt" lang={nbLang}>
                  <PortableText value={event.pricingInfo!} components={components} />
                </div>
              </div>
            )}
            {hasProgram && (
              <div className="bg-darkblue flex flex-col gap-3 p-6 text-white">
                <h2 className="font-heading text-h3 font-bold">{t('program.title')}</h2>
                <div className="sbsk-rt" lang={nbLang}>
                  <PortableText value={event.programInfo!} components={components} />
                </div>
              </div>
            )}
          </div>
        )}

        {hasSchedule && (
          <div className="flex flex-col gap-4">
            {event.schedule!.map((entry) => {
              const entryStart = new Date(entry.startTime);
              const entryEnd = new Date(entry.endTime);
              const location = entry.location ?? event.location;

              return (
                <EventScheduleCard
                  key={entry._key}
                  day={dayLabel(entryStart, entryEnd)}
                  month={monthAbbreviation(entryStart)}
                  title={entry.label}
                  meta={`${timeRange(entryStart, entryEnd)}${location ? ` · ${location}` : ''}`}
                  tone={tone}
                  ics={{
                    title: entry.label,
                    location,
                    start: entryStart,
                    end: entryEnd,
                  }}
                />
              );
            })}
          </div>
        )}

        <VenueCard venue={event.venue} />

        <SponsorGrid sponsors={sponsors} />
      </div>
    </div>
  );
}
