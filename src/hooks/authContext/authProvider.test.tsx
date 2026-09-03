import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { useAuth } from './authContext';

const getSession = vi.fn();
const onAuthStateChange = vi.fn();
const signOut = vi.fn();
const getProfile = vi.fn();
const isBoardAdmin = vi.fn();

// The provider talks to the client directly for session state, the same exception
// member-portal-loader.test.ts documents — everything else still goes through its query helper.
vi.mock('../../supabase/client', () => ({
  supabase: {
    auth: {
      getSession: () => getSession(),
      onAuthStateChange: (callback: unknown) => {
        onAuthStateChange(callback);
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      signOut: () => signOut(),
    },
  },
}));
vi.mock('../../supabase/queryHelpers/getProfile', () => ({
  getProfile: (id: string) => getProfile(id),
}));
vi.mock('../../supabase/queryHelpers/isBoardAdmin', () => ({
  isBoardAdmin: () => isBoardAdmin(),
}));

const { default: AuthProvider } = await import('./authProvider');

const session = { access_token: 'jwt-1', user: { id: 'auth-user-1' } };
const profile = { id: 'profile-1', supabase_id: 'auth-user-1', name: 'Kari' };

const signedIn = () => getSession.mockResolvedValue({ data: { session }, error: null });
const signedOut = () => getSession.mockResolvedValue({ data: { session: null }, error: null });

function Probe() {
  const { isAuthenticated, user, isAdmin, logout } = useAuth();
  return (
    <div>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="name">{user?.name ?? 'none'}</span>
      <span data-testid="admin">{String(isAdmin)}</span>
      <button onClick={() => void logout()}>Logg ut</button>
    </div>
  );
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  );
}

beforeEach(() => {
  getSession.mockReset();
  onAuthStateChange.mockReset();
  signOut.mockReset();
  getProfile.mockReset();
  isBoardAdmin.mockReset();
});

describe('AuthProvider — session derivation', () => {
  it('derives isAuthenticated from the live session and refetches the profile, not from a cache', async () => {
    signedIn();
    getProfile.mockResolvedValue(profile);
    isBoardAdmin.mockResolvedValue(true);

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'));
    expect(getProfile).toHaveBeenCalledWith('auth-user-1');
    await waitFor(() => expect(screen.getByTestId('name')).toHaveTextContent('Kari'));
    await waitFor(() => expect(screen.getByTestId('admin')).toHaveTextContent('true'));
  });

  it('starts signed out when there is no session', async () => {
    signedOut();

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'));
    expect(screen.getByTestId('name')).toHaveTextContent('none');
    expect(getProfile).not.toHaveBeenCalled();
  });
});

describe('AuthProvider — no localStorage mirror (#95)', () => {
  it('never writes the JWT, the profile or the admin flag to localStorage', async () => {
    signedIn();
    getProfile.mockResolvedValue(profile);
    isBoardAdmin.mockResolvedValue(true);

    renderProvider();

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'));
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(localStorage.getItem('isAdmin')).toBeNull();
  });

  it('clears stale keys left over from before this fix, even for a visitor with no session', async () => {
    localStorage.setItem('authToken', 'old-jwt');
    localStorage.setItem('userData', JSON.stringify(profile));
    localStorage.setItem('isAdmin', 'true');
    signedOut();

    renderProvider();

    await waitFor(() => expect(localStorage.getItem('authToken')).toBeNull());
    expect(localStorage.getItem('userData')).toBeNull();
    expect(localStorage.getItem('isAdmin')).toBeNull();
  });

  it('holds nothing in storage after logout', async () => {
    signedIn();
    getProfile.mockResolvedValue(profile);
    isBoardAdmin.mockResolvedValue(false);
    signOut.mockResolvedValue({ error: null });

    const { default: userEvent } = await import('@testing-library/user-event');
    renderProvider();
    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('true'));

    await userEvent.click(screen.getByRole('button', { name: 'Logg ut' }));

    await waitFor(() => expect(screen.getByTestId('authed')).toHaveTextContent('false'));
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(localStorage.getItem('isAdmin')).toBeNull();
  });
});
