import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import MembershipCardSection from './MembershipCardSection';
import type { Member } from '../../../supabase/queryHelpers/getMember';
import { currentSeason } from '../../../utils/membership';

const member = {
  id: 'member-1',
  name: 'Anna',
  surname: 'Testesen',
  member_since: '2025-03-01',
  member_card_token: '0123456789abcdef0123456789abcdef',
} as Member;

const renderCard = (props: Partial<Parameters<typeof MembershipCardSection>[0]> = {}) =>
  render(
    <MemoryRouter>
      <MembershipCardSection member={member} paid={true} {...props} />
    </MemoryRouter>,
  );

describe('MembershipCardSection', () => {
  it('shows a paid season and the code', () => {
    renderCard();
    expect(screen.getByText(`Medlem ${currentSeason()}: betalt`)).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'QR-kode for medlemskortet til Anna Testesen' }),
    ).toBeInTheDocument();
    expect(screen.getByText('0123 4567 89ab cdef 0123 4567 89ab cdef')).toBeInTheDocument();
  });

  it('says how to pay when the season is unpaid', () => {
    renderCard({ paid: false });
    expect(screen.getByText(`Medlem ${currentSeason()}: ikke betalt`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'sbsklubb@hotmail.com' })).toBeInTheDocument();
  });

  it('does not guess when the payment could not be read', () => {
    renderCard({ paid: null });
    expect(screen.getByText('Vi fikk ikke sjekket betalingen akkurat nå.')).toBeInTheDocument();
    expect(screen.queryByText(/ikke betalt/)).not.toBeInTheDocument();
  });

  it('swaps in a new code', async () => {
    const rotate = vi.fn().mockResolvedValue('ffffffffffffffffffffffffffffffff');
    renderCard({ rotate });
    await userEvent.click(screen.getByRole('button', { name: 'Lag ny kode' }));
    await waitFor(() =>
      expect(screen.getByText('ffff ffff ffff ffff ffff ffff ffff ffff')).toBeInTheDocument(),
    );
    expect(
      screen.getByText('Du har fått en ny kode. Den gamle virker ikke lenger.'),
    ).toBeInTheDocument();
  });

  it('keeps the old code and explains when a new one could not be made', async () => {
    const rotate = vi.fn().mockRejectedValue(new Error('offline'));
    renderCard({ rotate });
    await userEvent.click(screen.getByRole('button', { name: 'Lag ny kode' }));
    expect(await screen.findByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('0123 4567 89ab cdef 0123 4567 89ab cdef')).toBeInTheDocument();
  });

  it('says so when the register row could not be read', () => {
    renderCard({ member: null });
    expect(screen.getByText(/fikk ikke hentet medlemskortet/)).toBeInTheDocument();
  });
});
