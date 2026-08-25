import CalendarAddIcon from '../../assets/icons/symbols/calendar-add.svg?react';
import { downloadIcs, type IcsEventInput } from '../../utils/ics';

export type EventScheduleCardTone = 'orange' | 'blue';

// Fixed brand fills, not tied to light/dark mode — same choice CalendarSection's category
// cards make. `orange` mirrors the `turnering` category styling; `blue` mirrors `spillkveld`.
const TONE_STYLES: Record<EventScheduleCardTone, { surface: string; accent: string }> = {
  orange: {
    surface: 'bg-category-turnering text-darkestblue',
    accent: 'bg-darkorange text-darkestblue',
  },
  blue: { surface: 'bg-darkblue text-white', accent: 'bg-darkestblue text-white' },
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
  const styles = TONE_STYLES[tone];

  return (
    <div
      className={['flex border border-black dark:border-white', styles.surface, className]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'flex w-20 flex-none flex-col items-center justify-center p-1 sm:w-25',
          styles.accent,
        ].join(' ')}
      >
        <span className="font-heading text-3xl leading-[0.85] font-extrabold sm:text-4xl">
          {day}
        </span>
        <span className="font-heading mt-1 text-xs font-bold tracking-[0.14em] uppercase">
          {month}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
        <span className="font-body text-xs opacity-85">{meta}</span>
        <h3 className="font-heading text-h3 font-bold">{title}</h3>
        {description && <p className="font-body text-sm opacity-90">{description}</p>}
      </div>

      <button
        type="button"
        onClick={() => downloadIcs(ics, `${title}.ics`)}
        aria-label={`Legg til ${title} i kalenderen`}
        className="focus-visible:outline-focus-ring flex w-14 flex-none items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <CalendarAddIcon className="h-5 w-5 fill-current" />
      </button>
    </div>
  );
}
