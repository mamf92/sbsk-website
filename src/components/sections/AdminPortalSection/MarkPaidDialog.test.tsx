import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import MarkPaidDialog from './MarkPaidDialog';
import { testMember } from '../../../test/fixtures';

describe('MarkPaidDialog', () => {
  it('asks for an amount instead of recording 0 kr', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(
      <MarkPaidDialog
        member={testMember('ola')}
        season={2026}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Marker som betalt' }));

    expect(screen.getByText('Skriv inn et beløp')).toBeVisible();
    expect(screen.getByLabelText('Beløp (kr)')).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps the dialog open and says so when the save fails', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('nope'));
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(
      <MarkPaidDialog
        member={testMember('ola')}
        season={2026}
        onSubmit={onSubmit}
        onClose={onClose}
      />,
    );

    await user.type(screen.getByLabelText('Beløp (kr)'), '250');
    await user.click(screen.getByRole('button', { name: 'Marker som betalt' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Kunne ikke registrere betalingen');
    expect(onClose).not.toHaveBeenCalled();
  });
});
