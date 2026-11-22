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

const lookup = vi.fn();
const TOKEN = 'abcdefabcdefabcdefabcdefabcdefab';

function renderSection(overrides: { checkedIn?: string[]; guests?: number } = {}) {
  render(
    <MemoryRouter>
      <AdminCheckInSection
        event={event}
        members={members}
        checkedIn={overrides.checkedIn ?? []}
        guests={overrides.guests ?? 0}
        signups={[signup]}
        lookup={lookup}
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
  lookup.mockReset();
});

async function typeCard(code: string) {
  await userEvent.click(screen.getByRole('button', { name: 'Skann medlemskort' }));
  await userEvent.type(screen.getByLabelText('Kode fra medlemskortet'), code);
  await userEvent.click(screen.getByRole('button', { name: 'Finn medlem' }));
}

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

  it('locks a member while their check-in is saving, so an undo cannot race it', async () => {
    let finish: () => void = () => {};
    checkInMember.mockReturnValueOnce(new Promise<void>((resolve) => (finish = resolve)));
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Sjekk inn Anna Berg' }));
    const undo = screen.getByRole('button', { name: 'Angre innsjekk for Anna Berg' });
    expect(undo).toBeDisabled();

    finish();
    await vi.waitFor(() => expect(undo).toBeEnabled());
    expect(undoCheckIn).not.toHaveBeenCalled();
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

  it('keeps the newest guest count when an earlier queued write fails', async () => {
    let failFirst: () => void = () => {};
    setGuestCount
      .mockReturnValueOnce(
        new Promise<void>((_, reject) => (failFirst = () => reject(new Error('offline')))),
      )
      .mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderSection();

    await user.click(screen.getByRole('button', { name: 'Én gjest til' }));
    await user.click(screen.getByRole('button', { name: 'Én gjest til' }));
    failFirst();

    await vi.waitFor(() => expect(setGuestCount).toHaveBeenCalledTimes(2));
    expect(setGuestCount.mock.calls[1][1]).toBe(2);
    expect(screen.getByText('Gjester').previousSibling).toHaveTextContent('2');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('falls back to the last saved guest count when the last write fails', async () => {
    setGuestCount.mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('offline'));
    const user = userEvent.setup();
    renderSection({ guests: 3 });

    await user.click(screen.getByRole('button', { name: 'Én gjest til' }));
    await vi.waitFor(() => expect(setGuestCount).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Én gjest til' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Kunne ikke lagre antall gjester');
    expect(screen.getByText('Gjester').previousSibling).toHaveTextContent('4');
  });

  it('suggests counting a non-member as a guest when search finds nobody', async () => {
    const user = userEvent.setup();
    renderSection();
    await user.type(screen.getByRole('searchbox', { name: 'Søk etter medlem' }), 'Dina');
    expect(screen.getByText('Er personen ikke medlem? Tell dem som gjest.')).toBeVisible();
  });

  describe('membership card', () => {
    it('checks the card holder in and says who it was', async () => {
      lookup.mockResolvedValue({
        memberId: 'anna',
        name: 'Anna',
        surname: 'Berg',
        status: 'active',
        seasonPaid: true,
      });
      renderSection();
      await typeCard(`sbsk-medlem:${TOKEN}`);
      expect(lookup).toHaveBeenCalledWith(TOKEN);
      expect(await screen.findByText('Anna Berg er sjekket inn.')).toBeVisible();
      expect(checkInMember).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'event-1' }),
        'anna',
      );
    });

    it('does not check in twice, and flags an unpaid season', async () => {
      lookup.mockResolvedValue({
        memberId: 'ola',
        name: 'Ola',
        surname: 'Hansen',
        status: 'active',
        seasonPaid: false,
      });
      renderSection({ checkedIn: ['ola'] });
      await typeCard(TOKEN);
      expect(
        await screen.findByText(/Ola Hansen er allerede sjekket inn\. Ikke betalt/),
      ).toBeVisible();
      expect(checkInMember).not.toHaveBeenCalled();
    });

    it('refuses a disabled member and an unknown code', async () => {
      lookup.mockResolvedValueOnce({
        memberId: 'dina',
        name: 'Dina',
        surname: 'Lie',
        status: 'disabled',
        seasonPaid: false,
      });
      renderSection();
      await typeCard(TOKEN);
      expect(
        await screen.findByText('Dina Lie er deaktivert og kan ikke sjekkes inn.'),
      ).toBeVisible();
      lookup.mockResolvedValueOnce(null);
      await typeCard(TOKEN);
      expect(await screen.findByText(/Fant ingen med den koden/)).toBeVisible();
      expect(checkInMember).not.toHaveBeenCalled();
    });

    it('rejects text that is not a card code before looking anything up', async () => {
      renderSection();
      await typeCard('https://example.com');
      expect(screen.getByText('Det ser ikke ut som en kode fra et medlemskort.')).toBeVisible();
      expect(lookup).not.toHaveBeenCalled();
    });
  });
});
