import { describe, expect, it } from 'vitest';
import { groupByMonth, monthKey, monthLabel } from './groupByMonth';

describe('monthLabel', () => {
  it('renders an uppercase Norwegian month and year', () => {
    expect(monthLabel(new Date(2026, 8, 15))).toBe('SEPTEMBER 2026');
  });
});

describe('monthKey', () => {
  it('is stable across different days of the same month', () => {
    expect(monthKey(new Date(2026, 8, 1))).toBe(monthKey(new Date(2026, 8, 30)));
  });

  it('differs across months, including across a year boundary', () => {
    expect(monthKey(new Date(2026, 8, 1))).not.toBe(monthKey(new Date(2026, 9, 1)));
    expect(monthKey(new Date(2025, 11, 31))).not.toBe(monthKey(new Date(2026, 0, 1)));
  });
});

describe('groupByMonth', () => {
  type Item = { title: string; date: Date };
  const dateOf = (item: Item) => item.date;

  it('groups consecutive same-month items into one group', () => {
    const items: Item[] = [
      { title: 'A', date: new Date(2026, 8, 1) },
      { title: 'B', date: new Date(2026, 8, 15) },
    ];

    const groups = groupByMonth(items, dateOf);
    expect(groups).toHaveLength(1);
    expect(groups[0].label).toBe('SEPTEMBER 2026');
    expect(groups[0].items.map((item) => item.title)).toEqual(['A', 'B']);
  });

  it('starts a new group at each month change, in the order items appear', () => {
    const items: Item[] = [
      { title: 'A', date: new Date(2026, 8, 1) },
      { title: 'B', date: new Date(2026, 9, 1) },
      { title: 'C', date: new Date(2026, 9, 15) },
    ];

    const groups = groupByMonth(items, dateOf);
    expect(groups.map((g) => g.label)).toEqual(['SEPTEMBER 2026', 'OKTOBER 2026']);
    expect(groups[1].items.map((item) => item.title)).toEqual(['B', 'C']);
  });

  it("reopens an earlier month's group if the list revisits it out of order", () => {
    // Documents the behaviour, not a recommendation — a caller sorting by anything other than
    // date should skip grouping entirely rather than rely on this (see the function's own
    // comment): revisiting a month prints its divider a second time further down the list.
    const items: Item[] = [
      { title: 'A', date: new Date(2026, 8, 1) },
      { title: 'B', date: new Date(2026, 9, 1) },
      { title: 'C', date: new Date(2026, 8, 20) },
    ];

    const groups = groupByMonth(items, dateOf);
    expect(groups).toHaveLength(2);
    expect(groups[0].items.map((item) => item.title)).toEqual(['A', 'C']);
    expect(groups[1].items.map((item) => item.title)).toEqual(['B']);
  });

  it('returns no groups for an empty list', () => {
    expect(groupByMonth([], dateOf)).toEqual([]);
  });
});
