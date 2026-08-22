import { describe, expect, it, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
const getProfile = vi.fn();

// The loader reads the session off the client itself, so this is the one place where the client
// is mocked rather than the query helper. Everything that touches a table still goes through its
// helper, per the repo's own rule.
vi.mock('../supabase/client', () => ({
  supabase: { auth: { getUser: () => getUser() } },
}));
vi.mock('../supabase/queryHelpers/getProfile', () => ({
  getProfile: (supabaseId: string) => getProfile(supabaseId),
}));

const { memberPortalLoader } = await import('./member-portal-loader');

const user = { id: 'auth-user-1' };
const profile = { id: 'profile-1', supabase_id: 'auth-user-1', email: 'medlem@example.test' };

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
});

describe('memberPortalLoader', () => {
  it('returns the profile for a signed-in member', async () => {
    signedIn();
    getProfile.mockResolvedValue(profile);

    await expect(memberPortalLoader()).resolves.toEqual({ profile });
    // Keyed on the auth user id, which is `supabase_id` on the row — not the profile's own id.
    expect(getProfile).toHaveBeenCalledWith('auth-user-1');
  });

  it('redirects an anonymous visitor to login without querying anything', async () => {
    signedOut();

    const thrown = await thrownBy(memberPortalLoader);

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).status).toBe(302);
    expect((thrown as Response).headers.get('Location')).toBe('/login?reason=not_authenticated');
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

    expect((thrown as Response).headers.get('Location')).toBe('/login?reason=not_authenticated');
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
});
