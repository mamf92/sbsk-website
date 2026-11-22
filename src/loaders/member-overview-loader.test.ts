import { describe, expect, it, vi } from 'vitest';

const ev = (id: string, start: string) => ({
  _id: id,
  _type: 'event' as const,
  title: id,
  start,
  end: start,
  category: null,
  location: null,
  slug: null,
  hasDetailPage: false,
});

const getUpcomingEventsByIds = vi.fn();
vi.mock('./requireMember', () => ({
  requireMember: () => Promise.resolve({ user: { id: 'user-1' } }),
}));
vi.mock('../sanity/queryHelpers/admin-events', () => ({
  getUpcomingEventsForAdmin: () =>
    Promise.resolve([ev('soon', '2026-12-01T18:00:00Z'), ev('later', '2026-12-08T18:00:00Z')]),
  getUpcomingEventsByIds: (ids: string[]) => getUpcomingEventsByIds(ids),
}));
vi.mock('../supabase/queryHelpers/eventParticipants', () => ({
  getMySignups: () => Promise.resolve(['soon', 'far']),
  getAttendeeCounts: (ids: string[]) =>
    Promise.resolve(Object.fromEntries(ids.map((id) => [id, 1]))),
}));
vi.mock('../supabase/queryHelpers/getMember', () => ({ getMember: () => Promise.resolve(null) }));
vi.mock('../supabase/queryHelpers/getMyActivity', () => ({
  getMyCheckInCategories: () => Promise.resolve([]),
}));

const { memberOverviewLoader } = await import('./member-overview-loader');

describe('memberOverviewLoader', () => {
  it('fetches a sign-up beyond the upcoming pool so it is still listed', async () => {
    getUpcomingEventsByIds.mockResolvedValue([ev('far', '2027-06-01T18:00:00Z')]);
    const data = await memberOverviewLoader();

    expect(getUpcomingEventsByIds).toHaveBeenCalledWith(['far']);
    expect(data.events.map((event) => event._id)).toEqual(['soon', 'later', 'far']);
    expect(data.counts).toEqual({ soon: 1, later: 1, far: 1 });
    expect(data.failed).toBe(false);
  });

  it('flags the page when the extra fetch fails, and keeps the pool', async () => {
    getUpcomingEventsByIds.mockRejectedValue(new Error('offline'));
    const data = await memberOverviewLoader();

    expect(data.events.map((event) => event._id)).toEqual(['soon', 'later']);
    expect(data.failed).toBe(true);
  });
});
