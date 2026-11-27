import {
  dayOfMonth,
  formatDayLong,
  monthAbbreviation,
  osloDateKey,
  weekdayAbbreviation,
} from '../../utils/eventDateFormat';

/**
 * A date stamped onto a poster: weekday, a big day number and the month on an orange block,
 * slightly tilted on a hard shadow. A span of days reads «28–31». Oslo time throughout.
 * Decorative next to a heading that names the event, so the full date is in its `aria-label`.
 */
export function DateStamp({
  start,
  end,
  className = '',
}: {
  start: Date;
  end?: Date;
  className?: string;
}) {
  const span = end && osloDateKey(end) !== osloDateKey(start);
  const label = span
    ? `${formatDayLong(start, 'nb')} til ${formatDayLong(end, 'nb')}`
    : formatDayLong(start, 'nb');
  return (
    <span
      role="img"
      aria-label={label}
      className={`bg-orange text-darkestblue border-darkestblue tilt-left-lg flex w-20 flex-col items-center border-2 py-2 shadow-[4px_4px_0_var(--color-darkestblue)] ${className}`}
    >
      <span className="font-heading text-xs font-extrabold tracking-[0.16em] uppercase">
        {weekdayAbbreviation(start)}
      </span>
      <span className="font-heading text-4xl leading-none font-extrabold">
        {dayOfMonth(start)}
        {span && <span className="text-xl">–{dayOfMonth(end)}</span>}
      </span>
      <span className="font-heading text-xs font-extrabold tracking-[0.16em] uppercase">
        {span && monthAbbreviation(start) !== monthAbbreviation(end)
          ? `${monthAbbreviation(start)}–${monthAbbreviation(end)}`
          : monthAbbreviation(span ? end : start)}
      </span>
    </span>
  );
}

DateStamp.displayName = 'DateStamp';
