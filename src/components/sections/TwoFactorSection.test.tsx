import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import TwoFactorSection from './TwoFactorSection';

const verifyTotp = vi.fn();

vi.mock('../../supabase/queryHelpers/mfa', () => ({
  verifyTotp: (factorId: string, code: string) => verifyTotp(factorId, code),
}));

function renderSection() {
  const router = createMemoryRouter(
    [
      {
        path: '/to-faktor',
        element: (
          <TwoFactorSection
            title="Bekreft at det er deg"
            intro={<p>Skriv inn koden.</p>}
            factorId="factor-1"
            next="/styreportal"
            submitLabel="Bekreft"
          />
        ),
      },
      { path: '/styreportal', element: <h1>Styreportal</h1> },
    ],
    { initialEntries: ['/to-faktor'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const codeField = () => screen.getByRole('textbox', { name: 'Sekssifret kode' });
const submit = () => screen.getByRole('button', { name: 'Bekreft' });

beforeEach(() => verifyTotp.mockReset());

describe('TwoFactorSection', () => {
  it('rejects anything but six digits without calling Supabase', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.type(codeField(), '12345');
    await user.click(submit());

    expect(screen.getByText('Koden er seks siffer')).toBeVisible();
    expect(codeField()).toHaveAttribute('aria-invalid', 'true');
    expect(verifyTotp).not.toHaveBeenCalled();
  });

  it('accepts a spaced code, verifies it and goes on', async () => {
    verifyTotp.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderSection();

    await user.type(codeField(), '123 456');
    await user.click(submit());

    expect(verifyTotp).toHaveBeenCalledWith('factor-1', '123456');
    expect(await screen.findByRole('heading', { name: 'Styreportal' })).toBeVisible();
  });

  it('says so when the code is wrong, and clears the field', async () => {
    verifyTotp.mockRejectedValueOnce(new Error('Invalid TOTP code entered'));
    const user = userEvent.setup();
    renderSection();

    await user.type(codeField(), '000000');
    await user.click(submit());

    expect(await screen.findByRole('alert')).toHaveTextContent('Koden stemmer ikke.');
    expect(codeField()).toHaveValue('');
  });
});
