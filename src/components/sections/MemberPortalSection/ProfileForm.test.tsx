import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ProfileForm from './ProfileForm';
import type { Profile } from '../../../supabase/queryHelpers/getProfile';

const profile: Profile = {
  id: 'profile-1',
  supabase_id: 'user-1',
  email: 'martin@example.test',
  name: 'Martin',
  surname: 'Fischer',
  address: null,
  postcode: null,
  city: null,
  created_at: '2026-01-01T00:00:00Z',
  photo_url: null,
  photo_path: null,
  bio: null,
};

describe('ProfileForm', () => {
  it('surfaces a save failure instead of closing silently (#169)', async () => {
    const onSubmitProfile = vi.fn().mockRejectedValue(new Error('nettverksfeil'));
    const onClose = vi.fn();
    render(<ProfileForm profile={profile} onSubmitProfile={onSubmitProfile} onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Lagre endringer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('nettverksfeil');
    expect(onSubmitProfile).toHaveBeenCalledTimes(1);
    // The form stays open on failure — nothing here ever calls onClose on a rejection.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the rejection is not an Error', async () => {
    const onSubmitProfile = vi.fn().mockRejectedValue('not an Error instance');
    render(<ProfileForm profile={profile} onSubmitProfile={onSubmitProfile} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Lagre endringer' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Kunne ikke lagre endringene.');
  });

  it('resolves onSubmitProfile with the form values on a successful save', async () => {
    const onSubmitProfile = vi.fn().mockResolvedValue(undefined);
    render(<ProfileForm profile={profile} onSubmitProfile={onSubmitProfile} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: 'Lagre endringer' }));

    expect(onSubmitProfile).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'profile-1', name: 'Martin', surname: 'Fischer' }),
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('marks an invalid name field and blocks submission until it is fixed', async () => {
    const onSubmitProfile = vi.fn().mockResolvedValue(undefined);
    render(<ProfileForm profile={profile} onSubmitProfile={onSubmitProfile} onClose={vi.fn()} />);

    const nameInput = screen.getByLabelText('Fornavn');
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'x'); // Below the pattern's 2-character minimum.
    await userEvent.tab();

    expect(nameInput).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText("Minimum 2 bokstaver og - eller ' tillatt")).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Lagre endringer' }));
    expect(onSubmitProfile).not.toHaveBeenCalled();

    await userEvent.type(nameInput, 'artin');
    await userEvent.click(screen.getByRole('button', { name: 'Lagre endringer' }));

    expect(onSubmitProfile).toHaveBeenCalledTimes(1);
    expect(nameInput).not.toHaveAttribute('aria-invalid');
  });
});
