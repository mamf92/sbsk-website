import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LoaderFunctionArgs } from 'react-router-dom';
import { testMember } from '../test/fixtures';

const requireAdminSession = vi.fn();
const getProfile = vi.fn();
const getMembers = vi.fn();
const getMyActivity = vi.fn();
const getSeasonStatus = vi.fn();
const getEventSignupsForAdmin = vi.fn();
const getUpcomingEventsForAdmin = vi.fn();
const getAdminEvent = vi.fn();
const getCheckedIn = vi.fn();
const getGuestCount = vi.fn();

vi.mock('./requireAdminSession', () => ({
  requireAdminSession: (next: string) => requireAdminSession(next),
}));
vi.mock('../supabase/queryHelpers/getProfile', () => ({
  getProfile: (id: string) => getProfile(id),
}));
vi.mock('../supabase/queryHelpers/getMembers', () => ({ getMembers: () => getMembers() }));
vi.mock('../supabase/queryHelpers/getMyActivity', () => ({
  getMyActivity: (...args: unknown[]) => getMyActivity(...args),
}));
vi.mock('../supabase/queryHelpers/getSeasonStatus', () => ({
  getSeasonStatus: () => getSeasonStatus(),
}));
vi.mock('../supabase/queryHelpers/getEventSignupsForAdmin', () => ({
  getEventSignupsForAdmin: (ids: string[]) => getEventSignupsForAdmin(ids),
}));
vi.mock('../supabase/queryHelpers/checkIn', () => ({
  getCheckedIn: (id: string) => getCheckedIn(id),
  getGuestCount: (id: string) => getGuestCount(id),
}));
vi.mock('../sanity/queryHelpers/admin-events', () => ({
  getUpcomingEventsForAdmin: (limit: number) => getUpcomingEventsForAdmin(limit),
  getCheckInEvents: vi.fn().mockResolvedValue([]),
  getAdminEvent: (id: string) => getAdminEvent(id),
}));

const loaders = await import('./admin-portal-loaders');

const args = (url: string, params: Record<string, string> = {}) =>
  ({ request: new Request(url), params, context: undefined }) as unknown as LoaderFunctionArgs;

const me = testMember('me', { supabase_id: 'auth-1', is_admin: true });

beforeEach(() => {
  vi.clearAllMocks();
  requireAdminSession.mockResolvedValue({ id: 'auth-1' });
  getProfile.mockResolvedValue({ id: 'auth-1', name: 'Kari' });
  getMembers.mockResolvedValue([testMember('other'), me]);
  getMyActivity.mockResolvedValue({ checkIns: 2, signups: 3 });
  getSeasonStatus.mockResolvedValue({});
  getEventSignupsForAdmin.mockResolvedValue({});
});

describe('admin portal loaders', () => {
  it('gates the band on the tab being opened, with the basename stripped', async () => {
    const data = await loaders.adminPortalLoader(
      args('https://example.no/sbsk-website/styreportal/medlemmer?betalt=nei'),
    );
    expect(requireAdminSession).toHaveBeenCalledWith('/styreportal/medlemmer');
    expect(data.me).toBe(me);
    expect(getMyActivity).toHaveBeenCalledWith('auth-1', 'me');
  });

  it('does not query when the gate redirects', async () => {
    requireAdminSession.mockRejectedValue(new Response(null, { status: 302 }));
    await expect(loaders.adminMembersLoader()).rejects.toBeInstanceOf(Response);
    expect(getMembers).not.toHaveBeenCalled();
  });

  it('loads sign-ups for the overview events', async () => {
    getUpcomingEventsForAdmin.mockResolvedValue([{ _id: 'e1' }, { _id: 'e2' }]);
    await loaders.adminOverviewLoader();
    expect(getEventSignupsForAdmin).toHaveBeenCalledWith(['e1', 'e2']);
  });

  it('sends an unknown check-in event back to the list', async () => {
    getAdminEvent.mockResolvedValue(null);
    const thrown = await loaders
      .adminCheckInEventLoader(
        args('https://example.no/styreportal/innsjekk/nope', { eventId: 'nope' }),
      )
      .catch((e: unknown) => e);
    expect((thrown as Response).headers.get('Location')).toBe('/styreportal/innsjekk');
    expect(getCheckedIn).not.toHaveBeenCalled();
  });

  it('loads one event for the door', async () => {
    getAdminEvent.mockResolvedValue({ _id: 'e1', title: 'Spillkveld' });
    getCheckedIn.mockResolvedValue(['me']);
    getGuestCount.mockResolvedValue(4);
    getEventSignupsForAdmin.mockResolvedValue({ e1: [{ memberId: 'other' }] });

    const data = await loaders.adminCheckInEventLoader(
      args('https://example.no/styreportal/innsjekk/e1', { eventId: 'e1' }),
    );

    expect(requireAdminSession).toHaveBeenCalledWith('/styreportal/innsjekk/e1');
    expect(data).toMatchObject({ checkedIn: ['me'], guests: 4, signups: [{ memberId: 'other' }] });
  });
});
