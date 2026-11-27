import { Link as RouterLink, useLoaderData } from 'react-router-dom';
import { PortableText, toPlainText } from '@portabletext/react';
import { lazy } from 'react';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import type { ArrangementData } from '../sanity/queryHelpers/festivals';
import { components } from '../sanity/editors/portableTextComponents';
import { EventScheduleCard, type EventScheduleCardTone } from '../components/ui/EventScheduleCard';
import type { EventFact } from '../components/ui/EventFacts';
import { EventHero } from '../components/ui/EventHero';
import { EventKeyInfo } from '../components/ui/EventKeyInfo';
import { EventPageLayout } from '../components/ui/EventPageLayout';
import { Button } from '../components/ui/Buttons';
import { Panel } from '../components/ui/Panel';
import { SignupBlock } from '../components/ui/SignupBlock';
import { SponsorGrid, SponsorStrip } from '../components/ui/Sponsors';
import { RelatedPosts } from '../components/ui/RelatedPosts';
import { Tag } from '../components/ui/Tag';
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
import { downloadIcs, type IcsEventInput } from '../utils/ics';
import { useEventsT } from '../i18n';
import { pickLocale } from '../i18n/pickLocale';
import { useLocale, useTranslatedContent } from '../hooks/locale/useLocale';
import { redesignEnabled } from '../utils/featureFlags';
import { EventPageRedesign } from '../components/sections/redesign/EventPageRedesign';

const FestivalPage = lazy(() => import('../components/sections/FestivalPage/FestivalPage'));

/**
 * One template for every event that has `hasDetailPage` set, from a biweekly spillkveld with
 * nothing but a title and a description to a multi-day tournament — every section below is
 * conditional on the data actually being there, so a small event simply renders fewer of them.
 *
 * Page chrome is translated; the event's own title and texts are Norwegian-only fields, so in
 * English they carry `lang="nb"`.
 */
export default function SingleEventPage() {
  const data = useLoaderData() as ArrangementData | { event: CalendarEventTypes };
  // A festival shares the URL space; its page is its own chunk, loaded only when one is opened.
  if ('kind' in data && data.kind === 'festival') return <FestivalPage festival={data.festival} />;
  if (redesignEnabled) return <EventPageRedesign event={data.event} />;
  return <EventPage event={data.event} />;
}

function EventPage({ event }: { event: CalendarEventTypes }) {
  useTranslatedContent();
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
  // One place for every spot the page names it. `location` is the legacy free-text field.
  const place = event.venue?.name ?? event.location;
  const icsLocation =
    [event.venue?.name, event.venue?.address].filter(Boolean).join(', ') || event.location;
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
    ...(event.venue?.doorsOpen
      ? [{ id: 'doors', label: t('facts.doors'), value: event.venue.doorsOpen }]
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

  const ics: IcsEventInput = {
    title: event.title,
    description: event.content ? toPlainText(event.content) : undefined,
    location: icsLocation,
    start,
    end,
    url: window.location.href,
  };

  const keyInfo = (
    <EventKeyInfo
      label={t('keyInfo')}
      facts={facts}
      actions={
        <>
          <SignupBlock signup={event.signup} now={now} />
          <Button
            variant="secondary"
            size="sm"
            icon="add"
            onClick={() => downloadIcs(ics, `${event.title}.ics`)}
            aria-label={t('addEventToCalendar', { title: event.title })}
          >
            {t('addToCalendar')}
          </Button>
        </>
      }
    />
  );

  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white pb-16 dark:text-white">
      <div className="max-w-shell gap-stack mx-auto flex w-full flex-col px-3 pt-4 sm:px-6">
        <RouterLink to="/kalender" className={`${linkClassesInherit} mb-2 w-fit underline`}>
          ← {t('back')}
        </RouterLink>

        <div className="flex flex-col gap-0">
          <EventHero
            image={event.image}
            title={event.title}
            titleLang={nbLang}
            kicker={<Tag tone="orange">{t('kicker')}</Tag>}
            meta={
              <>
                <time dateTime={start.toISOString()}>
                  {formatDateTimeRange(start, end, locale)}
                </time>
                {place && (
                  <>
                    {' · '}
                    <span lang={nbLang}>{place}</span>
                  </>
                )}
              </>
            }
          />
          <SponsorStrip sponsors={sponsors} />
        </div>

        <EventPageLayout aside={keyInfo}>
          {hasContent && (
            <Panel lang={nbLang}>
              <div className="sbsk-rt">
                <PortableText value={event.content!} components={components} />
              </div>
            </Panel>
          )}

          {hasSchedule && (
            <div className="gap-stack flex flex-col">
              {event.schedule!.map((entry) => {
                const entryStart = new Date(entry.startTime);
                const entryEnd = new Date(entry.endTime);
                const location = entry.location ?? place;

                return (
                  <EventScheduleCard
                    key={entry._key}
                    size="lg"
                    day={dayLabel(entryStart, entryEnd, locale)}
                    month={monthAbbreviation(entryStart, locale)}
                    title={entry.label}
                    meta={`${timeRange(entryStart, entryEnd, locale)}${location ? ` · ${location}` : ''}`}
                    addLabel={t('addEventToCalendar', { title: entry.label })}
                    tone={tone}
                    lang={nbLang}
                    ics={{
                      title: entry.label,
                      location: entry.location ?? icsLocation,
                      start: entryStart,
                      end: entryEnd,
                    }}
                  />
                );
              })}
            </div>
          )}

          {(hasPricing || hasProgram) && (
            <div
              className={`gap-stack grid grid-cols-1 ${hasPricing && hasProgram ? 'md:grid-cols-2' : ''}`}
            >
              {hasPricing && (
                <Panel title={t('pricing')}>
                  <div className="sbsk-rt" lang={nbLang}>
                    <PortableText value={event.pricingInfo!} components={components} />
                  </div>
                </Panel>
              )}
              {hasProgram && (
                <Panel title={t('program.title')}>
                  <div className="sbsk-rt" lang={nbLang}>
                    <PortableText value={event.programInfo!} components={components} />
                  </div>
                </Panel>
              )}
            </div>
          )}

          <VenueCard venue={event.venue} inKeyFacts />

          <SponsorGrid sponsors={sponsors} className="pt-4" />

          <RelatedPosts posts={event.relatedPosts} className="pt-4 print:hidden" />
        </EventPageLayout>
      </div>
    </div>
  );
}
