import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ManualBadgesDialog from './ManualBadgesDialog';
import type { Member } from '../../../supabase/queryHelpers/getMember';

const member = { id: 'member-1', name: 'Anna', surname: 'Testesen' } as Member;

describe('ManualBadgesDialog', () => {
  it('ticks what the member has, and saves only the difference', async () => {
    const load = vi.fn().mockResolvedValue([
      { badge_slug: 'board', awarded_at: '2026-01-01T00:00:00Z', awarded_by: 'admin' },
      { badge_slug: 'regular', awarded_at: '2026-01-01T00:00:00Z', awarded_by: null },
    ]);
    const save = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<ManualBadgesDialog member={member} onClose={onClose} load={load} save={save} />);

    const board = await screen.findByRole('checkbox', { name: /Styreverv/ });
    expect(board).toBeChecked();
    expect(screen.queryByRole('checkbox', { name: /Stamgjest/ })).not.toBeInTheDocument();

    await userEvent.click(board);
    await userEvent.click(screen.getByRole('checkbox', { name: /Spillforklarer/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Lagre merker' }));

    expect(save).toHaveBeenCalledWith('member-1', ['teacher'], ['board']);
    expect(onClose).toHaveBeenCalled();
  });

  it('keeps the dialog open with a message when saving fails', async () => {
    const load = vi.fn().mockResolvedValue([]);
    const save = vi.fn().mockRejectedValue(new Error('rls'));
    const onClose = vi.fn();
    render(<ManualBadgesDialog member={member} onClose={onClose} load={load} save={save} />);

    await userEvent.click(await screen.findByRole('checkbox', { name: /Hjelpende hånd/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Lagre merker' }));

    expect(await screen.findByText('Kunne ikke lagre merkene. Prøv igjen.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('says so when the badges cannot be read, and does not offer to save', async () => {
    const load = vi.fn().mockRejectedValue(new Error('offline'));
    render(<ManualBadgesDialog member={member} onClose={vi.fn()} load={load} save={vi.fn()} />);
    expect(
      await screen.findByText('Kunne ikke hente merkene til Anna Testesen. Lukk og prøv igjen.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Lagre merker' })).toBeDisabled();
  });
});
