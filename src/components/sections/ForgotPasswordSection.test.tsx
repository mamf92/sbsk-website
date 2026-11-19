import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ForgotPasswordSection, { RESET_SENT } from './ForgotPasswordSection';

const requestPasswordReset = vi.fn();
vi.mock('../../supabase/queryHelpers/passwordReset', () => ({
  requestPasswordReset: (email: string) => requestPasswordReset(email),
}));

beforeEach(() => requestPasswordReset.mockReset());

async function submit() {
  render(
    <MemoryRouter>
      <ForgotPasswordSection />
    </MemoryRouter>,
  );
  await userEvent.type(screen.getByLabelText('E-post'), 'noen@example.com');
  await userEvent.click(screen.getByRole('button', { name: 'Send lenke' }));
}

describe('ForgotPasswordSection', () => {
  it('shows the same neutral confirmation after a request', async () => {
    requestPasswordReset.mockResolvedValue(undefined);
    await submit();
    expect(requestPasswordReset).toHaveBeenCalledWith('noen@example.com');
    expect(await screen.findByText(RESET_SENT)).toBeInTheDocument();
  });

  it('reports a real failure without saying anything about the account', async () => {
    requestPasswordReset.mockRejectedValue(new Error('rate limit'));
    await submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('prøv igjen');
    expect(screen.queryByText(RESET_SENT)).not.toBeInTheDocument();
  });
});
