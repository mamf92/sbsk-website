import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MyDataPanel, { type MyDataActions } from './MyDataPanel';
import type { Profile } from '../../../supabase/queryHelpers/getProfile';

const profile = { supabase_id: 'user-1', email: 'anna@example.no' } as Profile;

function actions(overrides: Partial<MyDataActions> = {}): MyDataActions {
  return {
    exportData: vi.fn().mockResolvedValue({ format: 'sbsk-export/1' }),
    download: vi.fn(),
    freshSignIn: vi.fn().mockResolvedValue(true),
    sendCode: vi.fn().mockResolvedValue(undefined),
    verifyCode: vi.fn().mockResolvedValue(undefined),
    removePhotos: vi.fn().mockResolvedValue(undefined),
    erase: vi.fn().mockResolvedValue(undefined),
    signOutHere: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

function renderPanel(a: MyDataActions) {
  render(
    <MemoryRouter initialEntries={['/medlemsportal/innstillinger']}>
      <Routes>
        <Route
          path="/medlemsportal/innstillinger"
          element={<MyDataPanel profile={profile} actions={a} />}
        />
        <Route path="/konto-slettet" element={<p>Slettet-siden</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

async function openAndConfirm() {
  await userEvent.click(screen.getByRole('button', { name: 'Slett kontoen min' }));
  await userEvent.type(screen.getByLabelText('Skriv SLETT for å bekrefte'), 'slett');
  const dialog = screen.getByRole('dialog');
  const buttons = dialog.querySelectorAll('button[type="submit"]');
  await userEvent.click(buttons[0] as HTMLElement);
}

describe('MyDataPanel', () => {
  it('downloads the export as a dated JSON file', async () => {
    const a = actions();
    renderPanel(a);
    await userEvent.click(screen.getByRole('button', { name: 'Last ned mine data' }));
    expect(a.download).toHaveBeenCalledWith(
      { format: 'sbsk-export/1' },
      expect.stringMatching(/^sbsk-mine-data-\d{4}-\d{2}-\d{2}\.json$/),
    );
  });

  it('explains the ten-minute limit', async () => {
    renderPanel(actions({ exportData: vi.fn().mockRejectedValue({ message: 'rate_limited' }) }));
    await userEvent.click(screen.getByRole('button', { name: 'Last ned mine data' }));
    expect(await screen.findByText(/Vent ti minutter/)).toBeInTheDocument();
  });

  it('will not delete until SLETT is typed', async () => {
    const a = actions();
    renderPanel(a);
    await userEvent.click(screen.getByRole('button', { name: 'Slett kontoen min' }));
    await userEvent.type(screen.getByLabelText('Skriv SLETT for å bekrefte'), 'nei');
    const submit = screen.getByRole('dialog').querySelector('button[type="submit"]');
    expect(submit).toBeDisabled();
    expect(a.erase).not.toHaveBeenCalled();
  });

  it('with a fresh sign-in, removes the photos, erases and says goodbye', async () => {
    const a = actions();
    renderPanel(a);
    await openAndConfirm();
    expect(await screen.findByText('Slettet-siden')).toBeInTheDocument();
    expect(a.removePhotos).toHaveBeenCalledWith('user-1');
    expect(a.erase).toHaveBeenCalledWith('SLETT');
    expect(a.signOutHere).toHaveBeenCalled();
    const removeOrder = vi.mocked(a.removePhotos).mock.invocationCallOrder[0];
    expect(removeOrder).toBeLessThan(vi.mocked(a.erase).mock.invocationCallOrder[0]);
  });

  it('asks for a new code when the sign-in is old, then erases', async () => {
    const a = actions({ freshSignIn: vi.fn().mockResolvedValue(false) });
    renderPanel(a);
    await openAndConfirm();
    expect(a.sendCode).toHaveBeenCalledWith('anna@example.no');
    expect(a.erase).not.toHaveBeenCalled();

    await userEvent.type(await screen.findByLabelText('Kode fra e-posten'), '123456');
    const submit = screen.getByRole('dialog').querySelector('button[type="submit"]');
    await userEvent.click(submit as HTMLElement);
    expect(a.verifyCode).toHaveBeenCalledWith('anna@example.no', '123456');
    expect(await screen.findByText('Slettet-siden')).toBeInTheDocument();
  });

  it('keeps the account and explains when the member is the last admin', async () => {
    const a = actions({ erase: vi.fn().mockRejectedValue({ message: 'last_admin' }) });
    renderPanel(a);
    await openAndConfirm();
    expect(await screen.findByText(/siste aktive administratoren/)).toBeInTheDocument();
    expect(a.signOutHere).not.toHaveBeenCalled();
  });
});
