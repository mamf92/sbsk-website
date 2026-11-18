import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AdminCheckInSection from './AdminCheckInSection';
import { testMember } from '../../../test/fixtures';
import type { AdminEvent } from '../../../sanity/queryHelpers/admin-events';
import type { AdminSignup } from '../../../supabase/queryHelpers/getEventSignupsForAdmin';

const checkInMember = vi.fn();
const undoCheckIn = vi.fn();
const setGuestCount = vi.fn();

vi.mock('../../../supabase/queryHelpers/checkIn', () => ({
  checkInMember: (...args: unknown[]) => checkInMember(...args),
  undoCheckIn: (...args: unknown[]) => undoCheckIn(...args),
  setGuestCount: (...args: unknown[]) => setGuestCount(...args),
}));

const event: AdminEvent = {
  _id: 'event-1',
  _type: 'event',
  title: 'Spillkveld',
  start: '2026-11-20T16:00:00Z',
  end: '2026-11-20T21:00:00Z',
  category: 'spillkveld',
  location: 'Sølvberget',
  slug: null,
  hasDetailPage: false,
};

const members = [
  testMember('anna', { name: 'Anna', surname: 'Berg' }),
  testMember('ola', { name: 'Ola', surname: 'Hansen' }),
  testMember('dina', { name: 'Dina', surname: 'Lie', status: 'disabled' }),
];

const signup: AdminSignup = {
  memberId: 'ola',
  supabaseId: 'u-ola',
  displayName: 'Ola Hansen',
  email: 'ola@example.no',
  source: 'rsvp',
  paymentStatus: null,
  createdAt: '2026-11-01T00:00:00Z',
};

function renderSection(overrides: { checkedIn?: string[]; guests?: number } = {}) {
  render(
    <MemoryRouter>
      <AdminCheckInSection
        event={event}
        members={members}
        checkedIn={overrides.checkedIn ?? []}
        guests={overrides.guests ?? 0}
        signups={[signup]}
      />
    </MemoryRouter>,
  );
}

const names = () =>
  within(screen.getByRole('list', { name: 'Medlemmer' }))
    .getAllByRole('listitem')
    .map((li) => li.querySelector('p')?.textContent);

beforeEach(() => {
  checkInMember.mockReset().mockResolvedValue(undefined);
  undoCheckIn.mockReset().mockResolvedValue(undefined);
  setGuestCount.mockReset().mockResolvedValue(undefined);
});

describe('AdminCheckInSection', () => {
  it('lists signed-up members first, then other active members, and focuses search', () => {
    renderSection();
    expect(names()).toEqual(['Ola Hansen', 'Anna Berg']);
    expect(screen.getByRole('searchbox', { name: 'Søk etter medlem' })).toHaveFocus();
  });

  it('checks a member in with the event snapshot, and counts it', async () => {
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Sjekk inn Anna Berg' }));

    expect(checkInMember).toHaveBeenCalledWith(
      { id: 'event-1', date: '2026-11-20', category: 'spillkveld' },
      'anna',
    );
    expect(screen.getByRole('button', { name: 'Angre innsjekk for Anna Berg' })).toBeVisible();
    expect(screen.getByText('Sjekket inn').previousSibling).toHaveTextContent('1');
  });

  it('rolls back and explains when the check-in fails', async () => {
    checkInMember.mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Sjekk inn Anna Berg' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Kunne ikke sjekke inn Anna');
    expect(screen.getByRole('button', { name: 'Sjekk inn Anna Berg' })).toBeVisible();
  });

  it('undoes a check-in', async () => {
    const user = userEvent.setup();
    renderSection({ checkedIn: ['ola'] });

    await user.click(screen.getByRole('button', { name: 'Angre innsjekk for Ola Hansen' }));

    expect(undoCheckIn).toHaveBeenCalledWith('event-1', 'ola');
  });

  it('counts guests up and down, never below zero', async () => {
    const user = userEvent.setup();
    renderSection({ guests: 1 });

    await user.click(screen.getByRole('button', { name: 'Én gjest til' }));
    await user.click(screen.getByRole('button', { name: 'Én gjest færre' }));
    await user.click(screen.getByRole('button', { name: 'Én gjest færre' }));

    expect(screen.getByText('Gjester').previousSibling).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: 'Én gjest færre' })).toBeDisabled();
    await vi.waitFor(() => expect(setGuestCount).toHaveBeenCalledTimes(3));
    expect(setGuestCount.mock.calls.map((call) => call[1])).toEqual([2, 1, 0]);
  });

  it('suggests counting a non-member as a guest when search finds nobody', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.type(screen.getByRole('searchbox', { name: 'Søk etter medlem' }), 'Dina');
    expect(screen.getByText('Er personen ikke medlem? Tell dem som gjest.')).toBeVisible();
  });
});
