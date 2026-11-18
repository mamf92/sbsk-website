import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminMembersSection from './AdminMembersSection';
import { testMember } from '../../../test/fixtures';
import { currentSeason } from '../../../utils/membership';

const markMembershipPaid = vi.fn();
const setMemberStatus = vi.fn();

vi.mock('../../../supabase/queryHelpers/markMembershipPaid', () => ({
  markMembershipPaid: (...args: unknown[]) => markMembershipPaid(...args),
}));
vi.mock('../../../supabase/queryHelpers/setMemberStatus', () => ({
  setMemberStatus: (...args: unknown[]) => setMemberStatus(...args),
}));
vi.mock('../../../supabase/queryHelpers/createMember', () => ({ createMember: vi.fn() }));
vi.mock('../../../supabase/queryHelpers/editMember', () => ({ editMember: vi.fn() }));

const members = [
  testMember('anna', { name: 'Anna', surname: 'Berg', supabase_id: 'u-anna' }),
  testMember('bjorn', { name: 'Bjørn', surname: 'Aas', is_admin: true, supabase_id: 'u-bjorn' }),
  testMember('dina', {
    name: 'Dina',
    surname: 'Lie',
    status: 'disabled',
    disabled_reason: 'Flyttet',
  }),
];
const seasonStatus = { anna: { paid: true, paidAt: '2026-02-01T12:00:00Z' } };

function renderAt(url = '/styreportal/medlemmer') {
  const router = createMemoryRouter(
    [
      {
        path: '/styreportal/medlemmer',
        element: <AdminMembersSection members={members} seasonStatus={seasonStatus} />,
      },
    ],
    { initialEntries: [url] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const rows = () =>
  within(screen.getByRole('list', { name: 'Medlemmer' }))
    .getAllByRole('listitem')
    .map((li) => li.getAttribute('aria-label'));

beforeEach(() => {
  markMembershipPaid.mockReset().mockResolvedValue(undefined);
  setMemberStatus.mockReset().mockResolvedValue(undefined);
});

describe('AdminMembersSection', () => {
  it('shows active members by default, in Norwegian name order', () => {
    renderAt();
    expect(rows()).toEqual(['Anna Berg', 'Bjørn Aas']);
    expect(screen.getByText('2 av 3 medlemmer vises.')).toBeVisible();
  });

  it('reads the filter from the URL, so the overview can link into it', () => {
    renderAt('/styreportal/medlemmer?status=deaktivert');
    expect(rows()).toEqual(['Dina Lie']);
    expect(screen.getByText('Årsak: Flyttet')).toBeVisible();
  });

  it('filters to unpaid and to the board, and writes the filter back to the URL', async () => {
    const user = userEvent.setup();
    const router = renderAt();

    await user.click(screen.getByRole('button', { name: `Ikke betalt ${currentSeason()}` }));
    expect(rows()).toEqual(['Bjørn Aas']);
    expect(router.state.location.search).toBe('?betalt=nei');

    await user.click(screen.getByRole('button', { name: `Ikke betalt ${currentSeason()}` }));
    await user.click(screen.getByRole('button', { name: 'Styret' }));
    expect(rows()).toEqual(['Bjørn Aas']);
  });

  it('searches by name, email or phone', async () => {
    const user = userEvent.setup();
    renderAt();
    await user.type(screen.getByRole('searchbox', { name: 'Søk etter medlem' }), 'anna@');
    expect(rows()).toEqual(['Anna Berg']);
  });

  it('offers the paid tick only to unpaid active members, and records the payment', async () => {
    const user = userEvent.setup();
    renderAt();

    expect(screen.queryByRole('button', { name: 'Marker Anna Berg som betalt' })).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Marker Bjørn Aas som betalt' }));

    const dialog = screen.getByRole('dialog', { name: 'Marker som betalt' });
    await user.type(within(dialog).getByLabelText('Beløp (kr)'), '300');
    await user.click(within(dialog).getByRole('button', { name: 'Marker som betalt' }));

    expect(markMembershipPaid).toHaveBeenCalledWith(
      expect.objectContaining({
        memberId: 'bjorn',
        payerName: 'Bjørn Aas',
        season: currentSeason(),
        amountNok: 300,
        method: 'bank',
      }),
    );
  });

  it('builds the payment reminder from the unpaid members in view', () => {
    renderAt();
    const link = screen.getByRole('link', { name: 'Send betalingspåminnelse (1)' });
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).toContain('bjorn@example.no');
    expect(decodeURIComponent(link.getAttribute('href') ?? '')).not.toContain('anna@example.no');
  });

  it('explains the last-admin refusal when deactivating', async () => {
    // What supabase-js really rejects with: a plain PostgrestError object, not an Error.
    setMemberStatus.mockRejectedValueOnce({ code: 'P0001', message: 'last_admin', details: null });
    const user = userEvent.setup();
    renderAt();

    await user.click(screen.getByRole('button', { name: 'Deaktiver Bjørn Aas' }));
    const dialog = screen.getByRole('dialog', { name: 'Deaktiver Bjørn Aas?' });
    await user.type(within(dialog).getByLabelText(/Årsak/), 'Gikk ut av styret');
    await user.click(within(dialog).getByRole('button', { name: 'Deaktiver' }));

    expect(setMemberStatus).toHaveBeenCalledWith('bjorn', 'disabled', 'Gikk ut av styret');
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Klubben må ha minst én aktiv administrator',
    );
  });
});
