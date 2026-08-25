import { useLoaderData } from 'react-router-dom';
import { PortableText, toPlainText } from '@portabletext/react';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { urlFor } from '../sanity/sanityImageUrl';
import { components } from '../sanity/editors/portableTextComponents';
import { Button } from '../components/ui/Buttons';
import { EventScheduleCard, type EventScheduleCardTone } from '../components/ui/EventScheduleCard';
import { monthAbbreviation, timeRange } from '../utils/eventDateFormat';

/** "23." for a single day, "23.–26." for a range — the date block's big number. */
function dayLabel(start: Date, end: Date): string {
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay ? `${start.getDate()}.` : `${start.getDate()}.–${end.getDate()}.`;
}

function openExternal(url: string) {
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * One template for every event that has `hasDetailPage` set, from a biweekly spillkveld with
 * nothing but a title and a description to a multi-day tournament — every section below is
 * conditional on the data actually being there, so a small event simply renders fewer of them.
 */
export default function SingleEventPage() {
  const { event } = useLoaderData() as { event: CalendarEventTypes };

  const start = new Date(event.eventStartTime);
  const end = new Date(event.eventEndTime);
  const tone: EventScheduleCardTone = event.category === 'spillkveld' ? 'blue' : 'orange';

  const hasContent = !!event.content?.length;
  const hasPricing = !!event.pricingInfo?.length;
  const hasProgram = !!event.programInfo?.length;
  const hasSponsors = !!event.showSponsors && !!event.sponsors?.length;
  const hasSchedule = !!event.schedule?.length;
  const signupUrl = event.signupUrl?.url;
  const signupLabel = event.signupUrl?.label || 'Meld deg på';

  return (
    <div className="dark:bg-darkestblue min-h-[60vh] bg-white pb-16 dark:text-white">
      <div className="max-w-content content-gutter:px-0 mx-auto flex w-full flex-col gap-8 px-3">
        {event.image && (
          <img
            src={urlFor(event.image).width(1440).fit('crop').url()}
            srcSet={[
              `${urlFor(event.image).width(400).fit('crop').url()} 400w`,
              `${urlFor(event.image).width(800).fit('crop').url()} 800w`,
              `${urlFor(event.image).width(1024).fit('crop').url()} 1024w`,
            ].join(', ')}
            sizes="(max-width: 400px) 400px, (max-width: 800px) 800px, 1024px"
            alt=""
            className="h-64 w-full object-cover sm:h-96"
          />
        )}

        <div className="bg-darkblue flex flex-col gap-2 p-4 text-white sm:p-6">
          <span className="font-heading text-orange text-xs font-bold tracking-[0.14em] uppercase">
            Arrangement
          </span>
          <h1 className="font-heading text-h1 tracking-heading font-bold">{event.title}</h1>
        </div>

        {hasSponsors && (
          <div className="bg-darkorange flex flex-col items-center gap-6 px-4 py-8 sm:px-8">
            <span className="font-body text-darkestblue text-xs font-semibold tracking-[0.14em] uppercase opacity-80">
              Med støtte fra
            </span>
            <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6">
              {event.sponsors!.map((sponsor, index) => {
                const logo = sponsor.logo && (
                  <img
                    src={urlFor(sponsor.logo).width(320).url()}
                    alt={sponsor.altText}
                    className="h-16 w-auto object-contain sm:h-24"
                  />
                );
                const ctaTarget = sponsor.ctaLink || sponsor.link;

                return (
                  <div key={index} className="flex flex-col items-center gap-2">
                    {sponsor.link ? (
                      <a
                        href={sponsor.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={sponsor.altText}
                      >
                        {logo}
                      </a>
                    ) : (
                      logo
                    )}
                    {sponsor.ctaLabel && ctaTarget && (
                      <Button variant="tertiary" size="xs" onClick={() => openExternal(ctaTarget)}>
                        {sponsor.ctaLabel}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {signupUrl && (
          <div className="flex justify-center">
            <Button
              variant="primary"
              size="lg"
              icon="right"
              onClick={() => openExternal(signupUrl)}
            >
              {signupLabel}
            </Button>
          </div>
        )}

        {hasContent && (
          <div className="bg-darkblue p-6 text-white sm:p-8">
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
            location: event.location,
            start,
            end,
            url: window.location.href,
          }}
        />

        {(hasPricing || hasProgram) && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {hasPricing && (
              <div className="bg-darkblue flex flex-col gap-3 p-6 text-white">
                <h2 className="font-heading text-h3 font-bold">Priser</h2>
                <div className="sbsk-rt">
                  <PortableText value={event.pricingInfo!} components={components} />
                </div>
              </div>
            )}
            {hasProgram && (
              <div className="bg-darkblue flex flex-col gap-3 p-6 text-white">
                <h2 className="font-heading text-h3 font-bold">Program</h2>
                <div className="sbsk-rt">
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
      </div>
    </div>
  );
}
