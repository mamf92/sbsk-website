const LOCALE = 'no-NO';

/** "AUGUST 2026" — the month divider between groups. */
export function monthLabel(date: Date): string {
  return date.toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' }).toUpperCase();
}

/** Sorts and groups by real calendar month, not by the rendered label. */
export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${date.getMonth()}`;
}

export type MonthGroup<T> = { key: string; label: string; items: T[] };

/**
 * Groups already-ordered items by calendar month, one group per month in the order its first
 * item appears — not a fixed calendar order, so this only reads as month sections when the
 * list is already date-sorted. A caller sorting by anything else (a title, say) should skip
 * grouping rather than call this: the same month key would otherwise reappear every time the
 * sort revisits it, printing the same divider several times down the list.
 */
export function groupByMonth<T>(items: readonly T[], dateOf: (item: T) => Date): MonthGroup<T>[] {
  const groups: MonthGroup<T>[] = [];
  for (const item of items) {
    const date = dateOf(item);
    const key = monthKey(date);
    const group = groups.find((candidate) => candidate.key === key);
    if (group) group.items.push(item);
    else groups.push({ key, label: monthLabel(date), items: [item] });
  }
  return groups;
}
