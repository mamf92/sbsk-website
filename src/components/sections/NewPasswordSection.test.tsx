import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import NewPasswordSection from './NewPasswordSection';

const updatePassword = vi.fn();
vi.mock('../../supabase/queryHelpers/passwordReset', () => ({
  updatePassword: (p: string) => updatePassword(p),
}));

beforeEach(() => updatePassword.mockReset());

function renderSection(linkValid: boolean) {
  const router = createMemoryRouter(
    [
      { path: '/nytt-passord', element: <NewPasswordSection linkValid={linkValid} /> },
      { path: '/login', element: <h1>Login</h1> },
      { path: '/glemt-passord', element: <h1>Glemt</h1> },
    ],
    { initialEntries: ['/nytt-passord'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

describe('NewPasswordSection', () => {
  it('rejects mismatching passwords without calling Supabase', async () => {
    renderSection(true);
    await userEvent.type(screen.getByLabelText('Nytt passord'), 'langtpassord1');
    await userEvent.type(screen.getByLabelText('Gjenta passordet'), 'annetpassord1');
    await userEvent.click(screen.getByRole('button', { name: 'Lagre passord' }));
    expect(await screen.findByText('Passordene er ikke like')).toBeInTheDocument();
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('saves a valid password and goes to login', async () => {
    updatePassword.mockResolvedValue(undefined);
    const router = renderSection(true);
    await userEvent.type(screen.getByLabelText('Nytt passord'), 'langtpassord1');
    await userEvent.type(screen.getByLabelText('Gjenta passordet'), 'langtpassord1');
    await userEvent.click(screen.getByRole('button', { name: 'Lagre passord' }));
    await screen.findByRole('heading', { name: 'Login' });
    expect(updatePassword).toHaveBeenCalledWith('langtpassord1');
    expect(router.state.location.search).toBe('?reason=password_changed');
  });

  it('offers a new link when the recovery link is not valid', () => {
    renderSection(false);
    expect(screen.getByRole('alert')).toHaveTextContent('utløpt');
    expect(screen.getByRole('link', { name: 'Send ny lenke' })).toBeInTheDocument();
  });
});
