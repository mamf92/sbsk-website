import type * as React from 'react';
import { IconButton } from './IconButton';
import { downloadIcs, type IcsEventInput } from '../../utils/ics';

export type EventScheduleCardTone = 'orange' | 'blue';

// Fixed brand fills, not tied to light/dark mode — same choice CalendarSection's category
// cards make. `orange` mirrors the `turnering` category styling; `blue` mirrors `spillkveld`.
//
// Each tone declares which hard shadow its fill can carry, because the add-to-calendar button
// lifts onto it — see the pairing table in docs/DESIGN_LANGUAGE.md. Without this the button cast
// the page default: darkestblue on `bg-darkblue` (1.24:1) in light mode, white on the orange
// fill (2.18:1) in dark. The tone sits on the card root rather than the button, since the root
// is the fill being cast onto and is not itself a lifting element.
const TONE_STYLES: Record<EventScheduleCardTone, { surface: string; accent: string }> = {
  orange: {
    surface: 'bg-category-turnering surface-light text-darkestblue',
    accent: 'bg-darkorange text-darkestblue',
  },
  blue: { surface: 'bg-darkblue surface-dark text-white', accent: 'bg-darkestblue text-white' },
};

// `lg` is the Figma day card: the date as a large numeral, for a page's list of days.
const SIZE_STYLES = {
  md: { block: 'w-20 sm:w-25', day: 'text-3xl sm:text-4xl', month: 'text-xs' },
  lg: { block: 'w-20 sm:w-32', day: 'text-4xl sm:text-daymark', month: 'text-sm sm:text-base' },
} as const;

interface EventScheduleCardProps {
  day: string;
  month: string;
  title: string;
  meta: string;
  description?: string;
  tone?: EventScheduleCardTone;
  size?: keyof typeof SIZE_STYLES;
  /** Extra lines under the description: a day's sign-up, a link to its programme. */
  children?: React.ReactNode;
  /** Powers the trailing "add to calendar" button. */
  ics: IcsEventInput;
  /** The button's accessible name, in the page's language: «Legg til {title} i kalenderen». */
  addLabel: string;
  className?: string;
  /** Language of the title and description when it differs from the page's, e.g. `nb` content
   *  on an English page. The date block, meta line and button follow the page. */
  lang?: string;
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
  size = 'md',
  children,
  ics,
  addLabel,
  className = '',
  lang,
}: EventScheduleCardProps) {
  const styles = TONE_STYLES[tone];
  const sizes = SIZE_STYLES[size];

  return (
    <div
      // A grid rather than a row so `children` can drop to a full-width line under the date block
      // on a phone: squeezed between the two fixed side columns, a sign-up button's label (which
      // never wraps) overran the calendar button at 320px.
      className={[
        'grid grid-cols-[auto_minmax(0,1fr)_auto] border border-black dark:border-white',
        styles.surface,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        className={[
          'flex flex-none flex-col items-center justify-center p-1',
          children ? 'sm:row-span-2' : '',
          sizes.block,
          styles.accent,
        ].join(' ')}
      >
        <span className={`font-heading leading-[0.85] font-extrabold ${sizes.day}`}>{day}</span>
        <span className={`font-heading mt-1 font-bold tracking-[0.14em] uppercase ${sizes.month}`}>
          {month}
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-4">
        <span className="font-body text-xs opacity-85">{meta}</span>
        <h3 className="font-heading text-h3 font-bold" lang={lang}>
          {title}
        </h3>
        {description && (
          <p className="font-body text-sm opacity-90" lang={lang}>
            {description}
          </p>
        )}
      </div>

      <div
        className={`col-start-3 row-start-1 flex items-center justify-center px-2 ${children ? 'sm:row-span-2' : ''}`}
      >
        {/* A square of its own, centred in the column, rather than a button the height of the
            card: stretched, its hover lifted a whole strip of the card instead of a button. */}
        <IconButton
          icon="calendarAdd"
          label={addLabel}
          onClick={() => downloadIcs(ics, `${title}.ics`)}
        />
      </div>

      {children && (
        <div className="col-span-3 flex flex-col items-start gap-2 px-4 pb-4 sm:col-span-1 sm:col-start-2 sm:-mt-2">
          {children}
        </div>
      )}
    </div>
  );
}
