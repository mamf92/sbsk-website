import { describe, expect, it, vi, beforeEach } from 'vitest';
import { redirect } from 'react-router-dom';

const requireAdminSession = vi.fn();
const getProfile = vi.fn();
const getMembers = vi.fn();

vi.mock('./requireAdminSession', () => ({
  requireAdminSession: (next: string) => requireAdminSession(next),
}));
vi.mock('../supabase/queryHelpers/getProfile', () => ({
  getProfile: (supabaseId: string) => getProfile(supabaseId),
}));
vi.mock('../supabase/queryHelpers/getMembers', () => ({
  getMembers: () => getMembers(),
}));

const { boardPortalLoader } = await import('./board-portal-loader');

const user = { id: 'auth-user-1' };
const profile = { id: 'profile-1', supabase_id: 'auth-user-1', email: 'styret@example.test' };
const members = [{ id: 'member-1', supabase_id: 'auth-user-1', is_admin: true }];

beforeEach(() => {
  requireAdminSession.mockReset();
  getProfile.mockReset();
  getMembers.mockReset();
});

describe('boardPortalLoader', () => {
  it('returns the profile and the register for an admin at aal2', async () => {
    requireAdminSession.mockResolvedValue(user);
    getProfile.mockResolvedValue(profile);
    getMembers.mockResolvedValue(members);

    await expect(boardPortalLoader()).resolves.toEqual({ profile, members });
    expect(requireAdminSession).toHaveBeenCalledWith('/styreportal');
    expect(getProfile).toHaveBeenCalledWith('auth-user-1');
  });

  it('passes the gate redirect on without querying anything', async () => {
    requireAdminSession.mockRejectedValue(redirect('/to-faktor?neste=%2Fstyreportal'));

    await expect(boardPortalLoader()).rejects.toBeInstanceOf(Response);
    expect(getProfile).not.toHaveBeenCalled();
    expect(getMembers).not.toHaveBeenCalled();
  });

  it('lets a failing query reach the error boundary', async () => {
    requireAdminSession.mockResolvedValue(user);
    getProfile.mockResolvedValue(profile);
    getMembers.mockRejectedValue(new Error('fetch failed'));

    await expect(boardPortalLoader()).rejects.toEqual(new Error('fetch failed'));
  });
});
