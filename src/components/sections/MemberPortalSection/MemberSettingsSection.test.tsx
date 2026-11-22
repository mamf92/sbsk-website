import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Profile } from '../../../supabase/queryHelpers/getProfile';

const setPassword = vi.fn();
const signOutEverywhere = vi.fn();
vi.mock('../../../supabase/queryHelpers/memberAuth', () => ({
  setPassword: (password: string) => setPassword(password),
  signOutEverywhere: () => signOutEverywhere(),
}));
vi.mock('../../../hooks/authContext/authContext', () => ({
  useAuth: () => ({ refreshSession: vi.fn().mockResolvedValue(false) }),
}));

const { default: MemberSettingsSection } = await import('./MemberSettingsSection');

const profile = {
  supabase_id: 'user-1',
  terms_accepted_version: '2026-11',
  terms_accepted_at: '2026-11-22T10:00:00Z',
} as Profile;

function renderSettings() {
  render(
    <MemoryRouter>
      <MemberSettingsSection profile={profile} />
    </MemoryRouter>,
  );
}

beforeEach(() => {
  setPassword.mockReset().mockResolvedValue(undefined);
  signOutEverywhere.mockReset().mockResolvedValue(undefined);
});

describe('MemberSettingsSection', () => {
  it('shows which terms the member accepted, and when', () => {
    renderSettings();
    expect(screen.getByText(/versjon 2026-11\) 22\. november 2026/)).toBeInTheDocument();
  });

  it('refuses a short password and saves a long one', async () => {
    renderSettings();
    const field = screen.getByLabelText('Nytt passord');
    await userEvent.type(field, 'kort');
    await userEvent.click(screen.getByRole('button', { name: 'Lagre passord' }));
    expect(setPassword).not.toHaveBeenCalled();

    await userEvent.clear(field);
    await userEvent.type(field, 'et-langt-passord');
    await userEvent.click(screen.getByRole('button', { name: 'Lagre passord' }));
    expect(setPassword).toHaveBeenCalledWith('et-langt-passord');
    expect(await screen.findByText('Passordet er lagret.')).toBeInTheDocument();
  });

  it('signs out on every device', async () => {
    renderSettings();
    await userEvent.click(screen.getByRole('button', { name: 'Logg ut på alle enheter' }));
    expect(signOutEverywhere).toHaveBeenCalled();
  });
});
