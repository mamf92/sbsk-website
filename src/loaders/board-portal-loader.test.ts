import { describe, expect, it, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
const getProfile = vi.fn();
const getMembers = vi.fn();

vi.mock('../supabase/client', () => ({
  supabase: { auth: { getUser: () => getUser() } },
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

async function thrownBy(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (thrown) {
    return thrown;
  }
  throw new Error('expected the loader to throw');
}

const signedIn = () => getUser.mockResolvedValue({ data: { user }, error: null });

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  getUser.mockReset();
  getProfile.mockReset();
  getMembers.mockReset();
});

describe('boardPortalLoader', () => {
  it('returns the profile and the member registry for an admin', async () => {
    signedIn();
    getProfile.mockResolvedValue(profile);
    getMembers.mockResolvedValue(members);

    await expect(boardPortalLoader()).resolves.toEqual({ profile, members });
    expect(getProfile).toHaveBeenCalledWith('auth-user-1');
  });

  it('redirects an anonymous visitor to login without querying anything', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });

    const thrown = await thrownBy(boardPortalLoader);

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(302);
    expect((thrown as Response).headers.get('Location')).toBe('/login?reason=not_authenticated');
    expect(getProfile).not.toHaveBeenCalled();
    expect(getMembers).not.toHaveBeenCalled();
  });

  // The two tiers are the whole point of this loader: no session is a login problem, a session
  // without permission is not. Collapsing them would send a member who is already past login
  // back to it with nothing to do there.
  it('falls back to the member portal, with a reason, when the registry denies permission', async () => {
    signedIn();
    getProfile.mockResolvedValue(profile);
    // What a non-admin actually gets: RLS on `members` answers with an error rather than rows.
    getMembers.mockRejectedValue(new Error('permission denied for table members'));

    const thrown = await thrownBy(boardPortalLoader);

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(302);
    expect((thrown as Response).headers.get('Location')).toBe('/medlemsportal?reason=not_admin');
  });

  // The same fallback, recognised from the Postgres error code alone (no message text to key
  // off) — the shape a real PostgREST 401/403 response actually carries.
  it('also recognises a permission failure carried only as an HTTP-style code', async () => {
    signedIn();
    getProfile.mockResolvedValue(profile);
    getMembers.mockRejectedValue({ code: '403', message: 'Forbidden' });

    const thrown = await thrownBy(boardPortalLoader);

    expect((thrown as Response).headers.get('Location')).toBe('/medlemsportal?reason=not_admin');
  });

  // #82: the catch used to be unable to see *why* getMembers failed, so an admin hitting a
  // genuine Supabase outage was bounced to the member portal as though they lacked permission,
  // with no explanation. That is now a fault like any other loader failure — the same tier the
  // profile-query test below already gets — rather than a silent, mislabelled redirect.
  it('lets a registry failure that is not a permission denial reach the error boundary', async () => {
    signedIn();
    getProfile.mockResolvedValue(profile);
    getMembers.mockRejectedValue(new Error('fetch failed'));

    const thrown = await thrownBy(boardPortalLoader);

    expect(thrown).not.toBeInstanceOf(Response);
    expect(thrown).toEqual(new Error('fetch failed'));
  });

  it('lets a failing profile query reach the error boundary', async () => {
    signedIn();
    getProfile.mockRejectedValue(new Error('supabase down'));

    const thrown = await thrownBy(boardPortalLoader);

    // Only `getMembers` is wrapped in the fallback. A profile that will not load is a fault, and
    // since #163 it renders the retry screen instead of React Router's developer screen.
    expect(thrown).not.toBeInstanceOf(Response);
    expect(thrown).toEqual(new Error('supabase down'));
    // And it is not worth asking the registry for rows the page can no longer render.
    expect(getMembers).not.toHaveBeenCalled();
  });
});
