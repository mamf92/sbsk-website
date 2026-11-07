import CalendarAddIcon from '../../assets/icons/symbols/calendar-add.svg?react';
import { downloadIcs, type IcsEventInput } from '../../utils/ics';

export type EventScheduleCardTone = 'orange' | 'blue';

// The tone colours only the date block, as a tag would; the card itself is an ordinary surface
// (decision 4: category colour is a small mark, never a card's fill).
const TONE_STYLES: Record<EventScheduleCardTone, string> = {
  orange: 'bg-tag-orange-bg text-tag-orange-fg',
  blue: 'bg-tag-blue-bg text-tag-blue-fg',
};

interface EventScheduleCardProps {
  day: string;
  month: string;
  title: string;
  meta: string;
  description?: string;
  tone?: EventScheduleCardTone;
  /** Powers the trailing "add to calendar" button. */
  ics: IcsEventInput;
  className?: string;
}

/**
 * The date-block + info + add-to-calendar anatomy shared by the event summary card and each
 * day/session row on `SingleEventPage`. Deliberately simpler than `CalendarSection`'s
 * `EventRow` — no RSVP, no expand/collapse — since neither call site needs those.
 */
export function EventScheduleCard({
  day,
  month,
  title,
  meta,
  description,
  tone = 'blue',
  ics,
  className = '',
}: EventScheduleCardProps) {
  return (
    <div
      className={['bg-surface text-fg shadow-card flex rounded-none', className]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'flex w-20 flex-none flex-col items-center justify-center p-1 sm:w-25',
          TONE_STYLES[tone],
        ].join(' ')}
      >
        <span className="font-heading text-3xl leading-[0.85] font-extrabold sm:text-4xl">
          {day}
        </span>
        <span className="font-heading mt-1 text-xs font-semibold uppercase">{month}</span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
        <span className="font-body text-fg-muted text-sm">{meta}</span>
        <h3 className="font-heading text-heading text-h4 font-bold">{title}</h3>
        {description && <p className="font-body text-fg-muted text-sm">{description}</p>}
      </div>

      <button
        type="button"
        onClick={() => downloadIcs(ics, `${title}.ics`)}
        aria-label={`Legg til ${title} i kalenderen`}
        className="text-fg hover:bg-surface-muted focus-visible:outline-focus flex w-14 flex-none cursor-pointer items-center justify-center transition-colors duration-150 focus-visible:outline-3 focus-visible:-outline-offset-3 motion-reduce:transition-none"
      >
        <CalendarAddIcon className="h-5 w-5 fill-current" />
      </button>
    </div>
  );
}
