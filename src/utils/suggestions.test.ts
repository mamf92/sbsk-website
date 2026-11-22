import { describe, expect, it } from 'vitest';
import { favouriteCategory, scoreSuggestions } from './suggestions';
import type { AdminEvent } from '../sanity/queryHelpers/admin-events';

const now = new Date('2026-11-22T12:00:00Z');
const event = (
  id: string,
  daysAhead: number,
  category: string | null = 'spillkveld',
): AdminEvent => ({
  _id: id,
  _type: 'event',
  title: id,
  start: new Date(now.getTime() + daysAhead * 86_400_000).toISOString(),
  end: new Date(now.getTime() + daysAhead * 86_400_000 + 3_600_000).toISOString(),
  category,
  location: null,
  slug: null,
  hasDetailPage: false,
});

describe('scoreSuggestions', () => {
  it('gives a new member the next events, earliest first', () => {
    const events = [event('c', 30), event('a', 20), event('b', 25), event('d', 40)];
    expect(scoreSuggestions(events, new Set(), {}, null, now).map((e) => e._id)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('leaves out joined and past events', () => {
    const events = [event('past', -1), event('joined', 2), event('open', 3)];
    expect(scoreSuggestions(events, new Set(['joined']), {}, null, now).map((e) => e._id)).toEqual([
      'open',
    ]);
  });

  it('puts the favourite category and popular events first', () => {
    const events = [event('soon', 2), event('popular', 20), event('favourite', 30, 'turnering')];
    const ranked = scoreSuggestions(events, new Set(), { popular: 6 }, 'turnering', now);
    expect(ranked.map((e) => e._id)).toEqual(['favourite', 'popular', 'soon']);
  });
});

describe('favouriteCategory', () => {
  it('picks the most frequent category and ignores blanks', () => {
    expect(favouriteCategory(['turnering', null, 'spillkveld', 'turnering'])).toBe('turnering');
    expect(favouriteCategory([])).toBeNull();
  });
});
