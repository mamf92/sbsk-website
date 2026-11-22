import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '../../supabase/queryHelpers/getProfile';

const completeOnboarding = vi.fn();
const setPassword = vi.fn();
const refreshSession = vi.fn();

vi.mock('../../supabase/queryHelpers/memberAuth', () => ({
  completeOnboarding: (values: unknown) => completeOnboarding(values),
  setPassword: (password: string) => setPassword(password),
}));
vi.mock('../../hooks/authContext/authContext', () => ({
  useAuth: () => ({ isAdmin: false, refreshSession }),
}));
vi.mock('../../hooks/useAuthActions', () => ({
  destinationAfterSignIn: () => '/medlemsportal',
  useAuthActions: () => ({}),
}));

const { default: RegisterSection } = await import('./RegisterSection');
const { CURRENT_LEGAL_VERSION } = await import('../../utils/legal');

const profile: Profile = {
  id: '1',
  supabase_id: 'user-1',
  email: 'medlem@example.no',
  name: 'Kari',
  surname: 'Nordmann',
  locale: 'nb',
  created_at: '2026-11-01T00:00:00Z',
  photo_url: null,
  photo_path: null,
  bio: null,
  terms_accepted_version: null,
  terms_accepted_at: null,
  show_in_attendee_lists: true,
};

function renderSetup(next: string | null = null) {
  render(
    <MemoryRouter initialEntries={['/lag-medlemsprofil']}>
      <Routes>
        <Route
          path="/lag-medlemsprofil"
          element={<RegisterSection profile={profile} next={next} />}
        />
        <Route path="/medlemsportal" element={<p>Min side</p>} />
        <Route path="/kalender" element={<p>Kalender</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  completeOnboarding.mockReset().mockResolvedValue(undefined);
  setPassword.mockReset().mockResolvedValue(undefined);
  refreshSession.mockReset().mockResolvedValue(true);
});

describe('RegisterSection first-time setup', () => {
  it('cannot finish without the age confirmation and the terms', async () => {
    renderSetup();
    await userEvent.click(screen.getByRole('button', { name: 'Lagre og gå til Min side' }));
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it('stores the accepted version and goes on to the next page', async () => {
    renderSetup('/kalender');
    expect(screen.getByLabelText('Fornavn')).toHaveValue('Kari');
    await userEvent.click(screen.getByLabelText('Jeg er 13 år eller eldre.'));
    await userEvent.click(screen.getByRole('checkbox', { name: /godtar/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Lagre og gå til Min side' }));

    expect(completeOnboarding).toHaveBeenCalledWith({
      supabaseId: 'user-1',
      name: 'Kari',
      surname: 'Nordmann',
      termsVersion: CURRENT_LEGAL_VERSION,
    });
    expect(setPassword).not.toHaveBeenCalled();
    expect(await screen.findByText('Kalender')).toBeInTheDocument();
  });

  it('refuses a short password', async () => {
    renderSetup();
    await userEvent.click(screen.getByLabelText('Jeg er 13 år eller eldre.'));
    await userEvent.click(screen.getByRole('checkbox', { name: /godtar/ }));
    await userEvent.type(screen.getByLabelText('Passord (valgfritt)', { exact: false }), 'kort');
    await userEvent.click(screen.getByRole('button', { name: 'Lagre og gå til Min side' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('minst 10 tegn');
    expect(completeOnboarding).not.toHaveBeenCalled();
  });

  it('keeps the profile and terms when only the password fails', async () => {
    setPassword.mockRejectedValue(new Error('AAL2 required'));
    renderSetup();
    await userEvent.click(screen.getByLabelText('Jeg er 13 år eller eldre.'));
    await userEvent.click(screen.getByRole('checkbox', { name: /godtar/ }));
    await userEvent.type(
      screen.getByLabelText('Passord (valgfritt)', { exact: false }),
      'et-langt-passord',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Lagre og gå til Min side' }));

    expect(completeOnboarding).toHaveBeenCalled();
    expect(await screen.findByRole('alert')).toHaveTextContent('Profilen er lagret');
  });
});
