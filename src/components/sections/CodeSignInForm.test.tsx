import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NOT_ON_LIST, CODE_INVALID } from '../../utils/errorMessage';

const requestSignInCode = vi.fn();
const signInWithCode = vi.fn();

vi.mock('../../hooks/useAuthActions', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../hooks/useAuthActions')>();
  return {
    ...actual,
    useAuthActions: () => ({ requestSignInCode, signInWithCode }),
  };
});

const { default: CodeSignInForm, CODE_SENT } = await import('./CodeSignInForm');
const { MemberDisabledError } = await import('../../hooks/useAuthActions');

beforeEach(() => {
  requestSignInCode.mockReset();
  signInWithCode.mockReset();
});

async function askForCode(onSignedIn = vi.fn()) {
  render(<CodeSignInForm onSignedIn={onSignedIn} />);
  await userEvent.type(screen.getByLabelText('E-post'), 'medlem@example.no');
  await userEvent.click(screen.getByRole('button', { name: 'Send meg en kode' }));
  return onSignedIn;
}

describe('CodeSignInForm', () => {
  it('sends a code, then signs in with it', async () => {
    requestSignInCode.mockResolvedValue(undefined);
    signInWithCode.mockResolvedValue({ isAdmin: false, needsOnboarding: true });
    const onSignedIn = await askForCode();

    expect(requestSignInCode).toHaveBeenCalledWith('medlem@example.no');
    expect(await screen.findByText(CODE_SENT)).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Kode fra e-posten'), '123456');
    await userEvent.click(screen.getByRole('button', { name: 'Logg inn' }));

    expect(signInWithCode).toHaveBeenCalledWith('medlem@example.no', '123456');
    expect(onSignedIn).toHaveBeenCalledWith({ isAdmin: false, needsOnboarding: true });
  });

  it('explains when the email is not on the member list', async () => {
    requestSignInCode.mockRejectedValue(new Error('Database error saving new user'));
    await askForCode();
    expect(await screen.findByRole('alert')).toHaveTextContent(NOT_ON_LIST);
  });

  it('explains a wrong code and a disabled account', async () => {
    requestSignInCode.mockResolvedValue(undefined);
    signInWithCode.mockRejectedValueOnce(new Error('Token has expired or is invalid'));
    signInWithCode.mockRejectedValueOnce(new MemberDisabledError());
    const onSignedIn = await askForCode();

    await userEvent.type(screen.getByLabelText('Kode fra e-posten'), '000000');
    await userEvent.click(screen.getByRole('button', { name: 'Logg inn' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(CODE_INVALID);

    await userEvent.click(screen.getByRole('button', { name: 'Logg inn' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Kontoen er deaktivert');
    expect(onSignedIn).not.toHaveBeenCalled();
  });
});
