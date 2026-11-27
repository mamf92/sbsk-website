import type { ReactNode } from 'react';
import { visitorAttendance, type Highlight } from '../../../utils/eventHighlights';
import { calendarEventIcs } from '../../../utils/eventIcs';
import { downloadIcs } from '../../../utils/ics';
import { EventPosterCard } from '../../ui/EventPosterCard';
import { Button } from '../../ui/Buttons';
import { siteUrl } from '../../../utils/siteUrl';

/**
 * Posters for special events, in a grid that never leaves a lone half-width card: one poster
 * spans the row, two share it, three or more run three across. An event without a page offers
 * «Legg i kalenderen» instead of «Les mer».
 */
export function PosterGrid({
  highlights,
  attendance = visitorAttendance,
  actions,
  wideFestival = false,
}: {
  highlights: Highlight[];
  attendance?: (highlight: Highlight) => string;
  actions?: (highlight: Highlight) => ReactNode;
  /** The calendar shows the first festival as a wide poster. */
  wideFestival?: boolean;
}) {
  const columns =
    highlights.length === 1
      ? ''
      : highlights.length === 2
        ? 'md:grid-cols-2'
        : 'md:grid-cols-2 lg:grid-cols-3';
  const firstFestival = highlights.findIndex((h) => h.kind === 'festival');
  return (
    <ul className={`grid grid-flow-dense grid-cols-1 gap-x-5 gap-y-10 ${columns}`}>
      {highlights.map((h, i) => {
        const wide =
          highlights.length === 1 || (wideFestival && i === firstFestival && highlights.length > 2);
        const own = actions?.(h);
        const event = h.event;
        return (
          <li
            key={h.key}
            className={`flex min-w-0 ${wide && highlights.length > 1 ? 'md:col-span-2' : ''}`}
          >
            <EventPosterCard
              kind={h.kind}
              title={h.title}
              start={h.start}
              end={h.end}
              allDay={h.allDay}
              location={h.location}
              image={h.image}
              href={h.href}
              wide={wide}
              attendance={attendance(h)}
              actions={
                own ??
                (!h.href && event ? (
                  <Button
                    variant="primary"
                    size="md"
                    icon="calendar"
                    className="w-full"
                    onClick={() =>
                      downloadIcs(calendarEventIcs(event, siteUrl()), 'sbsk-arrangement.ics')
                    }
                  >
                    Legg i kalenderen
                  </Button>
                ) : undefined)
              }
            />
          </li>
        );
      })}
    </ul>
  );
}
