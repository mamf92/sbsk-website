import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MemberForm from './MemberForm';
import type { Member } from '../../../supabase/queryHelpers/getMember';

const member: Member = {
  id: 'member-1',
  name: 'Trygve',
  surname: 'Dahl',
  phone: '40000001',
  address: 'Madlaveien 12',
  postcode: '4009',
  city: 'Stavanger',
  email: 'trygve@example.test',
  is_admin: false,
  supabase_id: 'aaaaaaaa-0000-4000-8000-000000000001',
  created_at: '2026-02-01T09:00:00Z',
};

async function submit() {
  await userEvent.click(screen.getByRole('button', { name: 'Lagre endringer' }));
}

describe('MemberForm', () => {
  it('awaits the save before closing, and stays open on failure (#169)', async () => {
    const onSubmitMember = vi.fn().mockRejectedValue(new Error('tilgang nektet'));
    const onClose = vi.fn();
    render(<MemberForm member={member} onSubmitMember={onSubmitMember} onClose={onClose} />);

    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('tilgang nektet');
    expect(onSubmitMember).toHaveBeenCalledTimes(1);
    // The old bug: onClose ran unconditionally, synchronously, before the save even resolved.
    expect(onClose).not.toHaveBeenCalled();
  });

  it('falls back to a generic message when the rejection is not an Error', async () => {
    const onSubmitMember = vi.fn().mockRejectedValue('not an Error instance');
    render(<MemberForm member={member} onSubmitMember={onSubmitMember} onClose={vi.fn()} />);

    await submit();

    expect(await screen.findByRole('alert')).toHaveTextContent('Kunne ikke lagre medlemmet.');
  });

  it('closes only after a successful save resolves', async () => {
    const onSubmitMember = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<MemberForm member={member} onSubmitMember={onSubmitMember} onClose={onClose} />);

    await submit();

    expect(onSubmitMember).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'member-1', name: 'Trygve', surname: 'Dahl' }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
