import type { AdminEvent } from '../sanity/queryHelpers/admin-events';

const DAY = 24 * 60 * 60 * 1000;

/**
 * "Forslag til deg" on Min side (docs/plans/phase-3-members.md, MyCalendar): up to `limit`
 * upcoming events the member has not joined, scored +3 for their most-attended category, +2
 * when at least 5 members are coming, +1 when it is within 14 days. Ties go to the earliest.
 * A new member with no history simply gets the next events.
 */
export function scoreSuggestions(
  events: AdminEvent[],
  joined: ReadonlySet<string>,
  attendeeCounts: Readonly<Record<string, number>>,
  favouriteCategory: string | null,
  now: Date,
  limit = 3,
): AdminEvent[] {
  return events
    .filter((event) => !joined.has(event._id) && new Date(event.start).getTime() > now.getTime())
    .map((event) => {
      let score = 0;
      if (favouriteCategory && event.category === favouriteCategory) score += 3;
      if ((attendeeCounts[event._id] ?? 0) >= 5) score += 2;
      if (new Date(event.start).getTime() - now.getTime() <= 14 * DAY) score += 1;
      return { event, score };
    })
    .sort(
      (a, b) =>
        b.score - a.score || new Date(a.event.start).getTime() - new Date(b.event.start).getTime(),
    )
    .slice(0, limit)
    .map(({ event }) => event);
}

/** The category the member has checked in to most often, or null without any check-ins. */
export function favouriteCategory(categories: (string | null)[]): string | null {
  const counts = new Map<string, number>();
  for (const category of categories) {
    if (category) counts.set(category, (counts.get(category) ?? 0) + 1);
  }
  let best: string | null = null;
  let bestCount = 0;
  for (const [category, count] of counts) {
    if (count > bestCount) [best, bestCount] = [category, count];
  }
  return best;
}
