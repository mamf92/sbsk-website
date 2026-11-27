import { useMemo, useState, type ReactNode } from 'react';
import { Link, useLoaderData, useSearchParams } from 'react-router-dom';
import { toPlainText } from '@portabletext/react';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import { EventRow } from '../components/sections/CalendarSection';
import { MonthGrid, Legend } from '../components/sections/redesign/MonthGrid';
import { Button } from '../components/ui/Buttons';
import { Chip, type ChipCategory } from '../components/ui/Chip';
import { Divider } from '../components/ui/Divider';
import EmptyState from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { Segmented } from '../components/ui/Segmented';
import { useAuth } from '../hooks/authContext/authContext';
import { useRsvp } from '../hooks/useRsvp';
import { memberPortalEnabled } from '../utils/featureFlags';
import { countdownLabel } from '../utils/eventHighlights';
import { groupByMonth } from '../utils/groupByMonth';
import { osloDateKey } from '../utils/eventDateFormat';
import {
  MONTHS,
  WEEKDAYS_LONG,
  monthKey,
  osloDay,
  parseDayKey,
  parseMonthKey,
} from '../utils/monthGrid';
import ArrowLeft from '../assets/icons/arrows/arrowleft.svg?react';

type Kategori = 'alle' | 'spillkveld' | 'turnering' | 'festival' | 'annet' | 'mine';

const FILTERS: { value: Kategori; label: string; chip: ChipCategory }[] = [
  { value: 'alle', label: 'Alle', chip: 'neutral' },
  { value: 'spillkveld', label: 'Spillkveld', chip: 'spillkveldKalender' },
  { value: 'turnering', label: 'Turnering', chip: 'turnering' },
  { value: 'festival', label: 'Festival', chip: 'arrangementer' },
  { value: 'annet', label: 'Annet', chip: 'annet' },
];
const KATEGORIER = new Set<string>([...FILTERS.map((f) => f.value), 'mine']);

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

function Group({ label, right, children }: { label: string; right?: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2.5" aria-label={label}>
      <Divider>
        <span>{label}</span>
        {right && <span>{right}</span>}
      </Divider>
      {children}
    </section>
  );
}

/**
 * «Alle arrangementer» (round 3, behind `redesignEnabled`): for finding one event, planning a
 * month, or going through the whole list. Search spans past and future, so there is no
 * «Kommende/Tidligere» switch to understand first. Every view lives in the URL — `?q=jul`,
 * `?kategori=spillkveld`, `?visning=maned&maned=2027-01&dag=2027-01-30`, `?tidligere=vis` — so
 * the overview can link to any of them.
 */
export default function CalendarAll() {
  const { events, eventsFailed } = useLoaderData() as {
    events: CalendarEventTypes[];
    eventsFailed: boolean;
  };
  const [params, setParams] = useSearchParams();
  const { isAuthenticated, user } = useAuth();
  const member = memberPortalEnabled && isAuthenticated && !!user;
  const rsvp = useRsvp(events);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const now = useMemo(() => new Date(), []);
  const today = osloDay(now);

  const q = params.get('q') ?? '';
  const rawKategori = params.get('kategori') ?? 'alle';
  const kategori = (
    KATEGORIER.has(rawKategori) && (rawKategori !== 'mine' || member) ? rawKategori : 'alle'
  ) as Kategori;
  const visning = params.get('visning') === 'maned' ? 'maned' : 'liste';
  const showPast = params.get('tidligere') === 'vis';

  /** Changes some parameters and keeps the rest; `null` removes one. */
  function update(changes: Record<string, string | null>, replace = false) {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    setParams(next, { replace, preventScrollReset: true });
  }

  const haystacks = useMemo(
    () =>
      new Map(
        events.map((event) => [
          event._id,
          [event.title, event.location ?? '', toPlainText(event.content ?? [])]
            .join(' ')
            .toLowerCase(),
        ]),
      ),
    [events],
  );

  const inSet = [...events]
    .sort((a, b) => +new Date(a.eventStartTime) - +new Date(b.eventStartTime))
    .filter((event) => {
      if (kategori === 'alle') return true;
      if (kategori === 'festival') return !!event.festivalDay;
      if (kategori === 'mine') return !event.festivalDay && rsvp.isAttending(event._id);
      return event.category === kategori && !event.festivalDay;
    })
    .filter((event) => !q.trim() || haystacks.get(event._id)?.includes(q.trim().toLowerCase()));
  const isPast = (event: CalendarEventTypes) => new Date(event.eventEndTime) < now;
  const coming = inSet.filter((event) => !isPast(event));
  const past = inSet.filter(isPast).reverse();
  const filtered = !!q.trim() || kategori !== 'alle';
  const filters: typeof FILTERS = member
    ? [...FILTERS, { value: 'mine', label: '★ Mine', chip: 'neutral' }]
    : FILTERS;

  function row(event: CalendarEventTypes, options: { past?: boolean; big?: boolean } = {}) {
    return (
      <EventRow
        key={event._id}
        event={event}
        rsvp={rsvp}
        variant={options.big ? 'card' : 'agenda'}
        highlight={q}
        past={options.past}
        expanded={expandedId === event._id}
        onToggle={() => setExpandedId(expandedId === event._id ? null : event._id)}
      />
    );
  }

  function listView() {
    if (q.trim()) {
      return (
        <>
          <Group label="Kommende" right={plural(coming.length, 'treff', 'treff')}>
            {coming.length ? (
              coming.map((event) => row(event))
            ) : (
              <p className="font-body text-darkestblue text-sm dark:text-white">Ingen kommende.</p>
            )}
          </Group>
          {past.length > 0 && (
            <Group label="Tidligere" right={plural(past.length, 'treff', 'treff')}>
              {past.map((event) => row(event, { past: true }))}
            </Group>
          )}
        </>
      );
    }
    const next = filtered ? undefined : coming[0];
    const rest = next ? coming.slice(1) : coming;
    const groups = groupByMonth(rest, (event) => new Date(event.eventStartTime));
    const pastGroups = groupByMonth(past, (event) => new Date(event.eventStartTime));
    return (
      <>
        {next && (
          <Group
            label="Neste arrangement"
            right={countdownLabel(new Date(next.eventStartTime), now)}
          >
            {row(next, { big: true })}
          </Group>
        )}
        {groups.map((group) => (
          <Group
            key={group.key}
            label={group.label}
            right={plural(group.items.length, 'arrangement', 'arrangementer')}
          >
            {group.items.map((event) => row(event))}
          </Group>
        ))}
        {past.length > 0 &&
          (showPast ? (
            pastGroups.map((group) => (
              <Group
                key={`past-${group.key}`}
                label={`${group.label} (tidligere)`}
                right={plural(group.items.length, 'arrangement', 'arrangementer')}
              >
                {group.items.map((event) => row(event, { past: true }))}
              </Group>
            ))
          ) : (
            <Group label="Tidligere" right={plural(past.length, 'arrangement', 'arrangementer')}>
              <Button
                variant="tertiary"
                size="md"
                className="w-full border border-black dark:border-white"
                onClick={() => update({ tidligere: 'vis' })}
              >
                Vis tidligere arrangementer
              </Button>
            </Group>
          ))}
      </>
    );
  }

  function monthView() {
    const selected = parseDayKey(params.get('dag'));
    const shown =
      parseMonthKey(params.get('maned')) ??
      (selected ? { y: selected.y, m: selected.m } : { y: today.y, m: today.m });
    const key = monthKey(shown.y, shown.m);
    const monthEvents = inSet.filter((event) =>
      osloDateKey(new Date(event.eventStartTime)).startsWith(key),
    );
    const dayEvents = selected
      ? inSet.filter((event) => osloDateKey(new Date(event.eventStartTime)) === selected.key)
      : [];
    const dayLabel = selected
      ? `${WEEKDAYS_LONG[selected.weekday].charAt(0).toUpperCase()}${WEEKDAYS_LONG[
          selected.weekday
        ].slice(1)} ${selected.d}. ${MONTHS[selected.m]}`
      : '';
    return (
      <>
        <div className="flex flex-col gap-2">
          <MonthGrid
            year={shown.y}
            month={shown.m}
            events={inSet}
            todayKey={today.key}
            selectedKey={selected?.key}
            onSelect={(day) => update({ dag: day })}
            onMonth={(delta) => update({ maned: monthKey(shown.y, shown.m + delta), dag: null })}
            onToday={() => update({ maned: monthKey(today.y, today.m), dag: null })}
          />
          <Legend />
        </div>
        {selected ? (
          <Group label={dayLabel} right={plural(dayEvents.length, 'arrangement', 'arrangementer')}>
            {dayEvents.length ? (
              dayEvents.map((event) => row(event, { past: isPast(event) }))
            ) : (
              <p className="font-body text-darkestblue text-sm dark:text-white">
                Ingenting denne dagen.
              </p>
            )}
          </Group>
        ) : (
          <Group
            label={`I ${MONTHS[shown.m]}`}
            right={plural(monthEvents.length, 'arrangement', 'arrangementer')}
          >
            {monthEvents.length ? (
              monthEvents.map((event) => row(event, { past: isPast(event) }))
            ) : (
              <p className="font-body text-darkestblue text-sm dark:text-white">
                Ingen arrangementer denne måneden.
              </p>
            )}
          </Group>
        )}
      </>
    );
  }

  return (
    <div className="dark:bg-darkestblue bg-white">
      <section className="bg-darkblue surface-dark dot-pattern relative overflow-hidden text-white">
        <div className="max-w-content relative mx-auto flex flex-col gap-4 px-4 pt-6 pb-5 sm:px-6">
          <Link
            to="/kalender"
            className="font-heading inline-flex w-fit items-center gap-1.5 text-sm font-bold text-white/90 underline-offset-4 hover:underline"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4 fill-current" /> Kalender
          </Link>
          <h1 className="font-heading text-[clamp(2.1rem,5vw,3rem)] leading-none font-extrabold">
            Alle arrangementer
          </h1>
          <form role="search" onSubmit={(event) => event.preventDefault()}>
            <Input
              type="search"
              icon="search"
              aria-label="Søk i alle arrangementer"
              placeholder="Søk etter navn eller sted"
              value={q}
              onChange={(event) => update({ q: event.target.value }, true)}
              className="text-lg"
            />
          </form>
        </div>
      </section>

      <div className="dark:bg-darkestblue sticky top-0 z-10 border-b border-black bg-white dark:border-white">
        <div className="max-w-content mx-auto flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div
            role="group"
            aria-label="Kategori"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {filters.map((filter) => (
              <Chip
                key={filter.value}
                className="flex-none normal-case"
                category={filter.chip}
                active={kategori === filter.value}
                aria-pressed={kategori === filter.value}
                onClick={() => update({ kategori: filter.value === 'alle' ? null : filter.value })}
              >
                {filter.label}
              </Chip>
            ))}
          </div>
          <Segmented
            label="Visning"
            options={[
              { value: 'liste', label: 'Liste' },
              { value: 'maned', label: 'Måned' },
            ]}
            value={visning}
            onChange={(value) =>
              update(
                value === 'maned'
                  ? { visning: 'maned' }
                  : { visning: null, maned: null, dag: null },
              )
            }
          />
        </div>
      </div>

      <div className="max-w-content mx-auto flex flex-col gap-6 px-4 py-6 sm:px-6">
        {eventsFailed ? (
          <EmptyState
            variant="inline"
            className="text-darkestblue dark:text-white"
            title="Kunne ikke laste arrangementer"
            body="Vi fikk ikke kontakt med innholdstjenesten. Prøv å laste siden på nytt om et øyeblikk."
          />
        ) : (
          <>
            {filtered && (
              <div
                role="status"
                className="font-body text-darkestblue flex flex-wrap items-center justify-between gap-3 dark:text-white"
              >
                <span>
                  <strong>{plural(inSet.length, 'treff', 'treff')}</strong>
                  {q.trim() && <> for «{q.trim()}»</>}
                  {kategori !== 'alle' && (
                    <>
                      {' '}
                      i{' '}
                      {kategori === 'mine'
                        ? 'dine påmeldinger'
                        : filters.find((f) => f.value === kategori)?.label.toLowerCase()}
                    </>
                  )}
                </span>
                <Button
                  variant="tertiary"
                  size="sm"
                  icon="backspace"
                  onClick={() => update({ q: null, kategori: null })}
                >
                  Nullstill
                </Button>
              </div>
            )}
            {inSet.length === 0 && visning === 'liste' ? (
              <EmptyState
                variant="inline"
                className="text-darkestblue dark:text-white"
                title={kategori === 'mine' ? 'Ingen påmeldinger' : 'Ingen treff'}
                body={
                  kategori === 'mine'
                    ? 'Du er ikke påmeldt noen arrangementer ennå.'
                    : 'Prøv et annet ord, eller fjern filteret.'
                }
              />
            ) : visning === 'maned' ? (
              monthView()
            ) : (
              listView()
            )}
          </>
        )}
      </div>
    </div>
  );
}
