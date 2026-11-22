import { describe, expect, it, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
const getProfile = vi.fn();
const isActiveMember = vi.fn();
const signOut = vi.fn();

// The loader reads the session off the client itself, so this is the one place where the client
// is mocked rather than the query helper. Everything that touches a table still goes through its
// helper, per the repo's own rule.
vi.mock('../supabase/client', () => ({
  supabase: { auth: { getUser: () => getUser(), signOut: () => signOut() } },
}));
const getMember = vi.fn();
const getMyActivity = vi.fn();
vi.mock('../supabase/queryHelpers/getMember', () => ({
  getMember: (id: string) => getMember(id),
}));
vi.mock('../supabase/queryHelpers/getMyActivity', () => ({
  getMyActivity: (id: string, memberId: string) => getMyActivity(id, memberId),
}));
const getMyBadges = vi.fn();
vi.mock('../supabase/queryHelpers/badges', () => ({
  getMyBadges: () => getMyBadges(),
}));
vi.mock('../supabase/queryHelpers/memberAuth', () => ({
  isActiveMember: () => isActiveMember(),
}));
vi.mock('../supabase/queryHelpers/getProfile', () => ({
  getProfile: (supabaseId: string) => getProfile(supabaseId),
}));

const { memberPortalLoader } = await import('./member-portal-loader');
const { CURRENT_LEGAL_VERSION } = await import('../utils/legal');

const user = { id: 'auth-user-1' };
const profile = {
  id: 'profile-1',
  supabase_id: 'auth-user-1',
  email: 'medlem@example.test',
  terms_accepted_version: CURRENT_LEGAL_VERSION,
};

/** Loaders signal a redirect by throwing, so the interesting value is the one that comes out. */
async function thrownBy(run: () => Promise<unknown>) {
  try {
    await run();
  } catch (thrown) {
    return thrown;
  }
  throw new Error('expected the loader to throw');
}

const signedIn = () => getUser.mockResolvedValue({ data: { user }, error: null });
const signedOut = () => getUser.mockResolvedValue({ data: { user: null }, error: null });

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  getUser.mockReset();
  getProfile.mockReset();
  isActiveMember.mockReset().mockResolvedValue(true);
  signOut.mockReset().mockResolvedValue({ error: null });
});

describe('memberPortalLoader', () => {
  it('returns the profile for a signed-in member', async () => {
    signedIn();
    getProfile.mockResolvedValue(profile);

    getMember.mockResolvedValue({ id: 'member-1' });
    getMyActivity.mockResolvedValue({ checkIns: 3, signups: 1 });
    const badges = [{ slug: 'first-roll', kind: 'auto', awarded_at: null, progress: 0, target: 1 }];
    getMyBadges.mockResolvedValue(badges);

    await expect(memberPortalLoader()).resolves.toEqual({
      profile,
      me: { id: 'member-1' },
      activity: { checkIns: 3, signups: 1 },
      badges,
    });
    expect(getMyActivity).toHaveBeenCalledWith('auth-user-1', 'member-1');
    // Keyed on the auth user id, which is `supabase_id` on the row — not the profile's own id.
    expect(getProfile).toHaveBeenCalledWith('auth-user-1');
  });

  it('redirects an anonymous visitor to login without querying anything', async () => {
    signedOut();

    const thrown = await thrownBy(memberPortalLoader);

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(302);
    expect((thrown as Response).headers.get('Location')).toBe(
      '/login?reason=not_authenticated&neste=%2Fmedlemsportal',
    );
    // A profile query for a visitor with no session can only come back empty, so the guard has to
    // come first rather than letting RLS answer it.
    expect(getProfile).not.toHaveBeenCalled();
  });

  it('sends a visitor to login when the auth check itself fails', async () => {
    // supabase-js does not reject here; a network failure surfaces as a null user plus an error.
    // The loader cannot tell that apart from "not signed in", so an outage reads as a logout. That
    // is the current contract — this pins it so a future change to it is a deliberate one.
    getUser.mockResolvedValue({ data: { user: null }, error: new Error('auth unreachable') });

    const thrown = await thrownBy(memberPortalLoader);

    expect((thrown as Response).headers.get('Location')).toBe(
      '/login?reason=not_authenticated&neste=%2Fmedlemsportal',
    );
  });

  it('lets a failing profile query reach the error boundary', async () => {
    signedIn();
    getProfile.mockRejectedValue(new Error('supabase down'));

    const thrown = await thrownBy(memberPortalLoader);

    // #163 gave every route an errorElement, so this now renders the apology-and-retry screen.
    // Before that it fell through to React Router's developer screen. A redirect here would be
    // worse than either: bouncing a signed-in member to login blames them for our outage.
    expect(thrown).not.toBeInstanceOf(Response);
    expect(thrown).toEqual(new Error('supabase down'));
  });

  it('signs a disabled member out and says why', async () => {
    signedIn();
    isActiveMember.mockResolvedValue(false);

    const thrown = await thrownBy(memberPortalLoader);

    expect(signOut).toHaveBeenCalled();
    expect((thrown as Response).headers.get('Location')).toBe('/login?reason=disabled');
    expect(getProfile).not.toHaveBeenCalled();
  });

  it('sends a member who has not accepted the current terms to first-time setup', async () => {
    signedIn();
    getProfile.mockResolvedValue({ ...profile, terms_accepted_version: null });

    const thrown = await thrownBy(memberPortalLoader);

    expect((thrown as Response).headers.get('Location')).toBe(
      '/lag-medlemsprofil?neste=%2Fmedlemsportal',
    );
  });
});
