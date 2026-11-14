import { useEventsT } from '../../../i18n';
import { pickLocale } from '../../../i18n/pickLocale';
import { useLocale } from '../../../hooks/locale/useLocale';
import type { FestivalTypes } from '../../../sanity/queryHelpers/festivals';
import { formatDayLong } from '../../../utils/eventDateFormat';
import { festivalDate, groupByStart, scheduledSessions } from '../../../utils/festival';

/**
 * The whole programme as compact rows, every day one after another, for paper. Hidden on screen;
 * the interactive programme is hidden in print instead. One row per session: time · title ·
 * format · room.
 */
export function PrintProgram({ festival }: { festival: FestivalTypes }) {
  const t = useEventsT();
  const { locale } = useLocale();
  const sponsors = festival.sponsors ?? [];

  return (
    <section className="font-body hidden flex-col gap-4 text-black print:flex">
      <h2 className="font-heading text-h3 font-bold">{t('program.printHeading')}</h2>
      {(festival.days ?? []).map((day) => {
        const sessions = groupByStart(scheduledSessions(day)).flatMap((group) => group.sessions);
        return (
          <div key={day._key} className="flex break-inside-avoid flex-col gap-1">
            <h3 className="font-heading font-bold first-letter:uppercase">
              {formatDayLong(festivalDate(day.date), locale)}
            </h3>
            {sessions.length === 0 ? (
              <p>{t('program.emptyDay')}</p>
            ) : (
              <ul className="text-sm">
                {sessions.map((session) => (
                  <li key={session._key}>
                    {session.start}–{session.end} ·{' '}
                    {pickLocale(session.title, locale)?.value ??
                      session.game?.name ??
                      t(`format.${session.format ?? 'annet'}`)}
                    {session.format && ` · ${t(`format.${session.format}`)}`}
                    {session.room && ` · ${session.room}`}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
      {sponsors.length > 0 && (
        <p className="text-sm">
          {t('sponsors.title')}: {sponsors.map((sponsor) => sponsor.altText).join(', ')}
        </p>
      )}
    </section>
  );
}
