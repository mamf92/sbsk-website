import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import BadgeGrid from './BadgeGrid';
import { orderBadges, progressText } from '../../../utils/badges';
import type { MyBadge } from '../../../supabase/queryHelpers/badges';

const badge = (slug: string, overrides: Partial<MyBadge> = {}): MyBadge => ({
  slug,
  kind: 'auto',
  awarded_at: null,
  progress: 0,
  target: 1,
  ...overrides,
});

const BADGES: MyBadge[] = [
  badge('first-roll', { awarded_at: '2026-01-10T18:00:00Z', progress: 1 }),
  badge('regular', { progress: 3, target: 10 }),
  badge('streak-4', { awarded_at: '2026-04-10T18:00:00Z', progress: 4, target: 4 }),
  badge('teacher', { kind: 'manual', progress: null, target: null }),
  badge('board', {
    kind: 'manual',
    awarded_at: '2026-02-01T12:00:00Z',
    progress: null,
    target: null,
  }),
];

describe('BadgeGrid', () => {
  it('lists earned badges first, newest first, then the ones to work toward', () => {
    expect(orderBadges(BADGES).map((b) => b.slug)).toEqual([
      'streak-4',
      'board',
      'first-roll',
      'regular',
      'teacher',
    ]);
  });

  it('writes progress with the unit', () => {
    expect(progressText(BADGES[1])).toBe('3 av 10 innsjekkinger');
    expect(progressText(BADGES[3])).toBeUndefined();
  });

  it('shows earned and locked badges, but not manual ones the member has not been given', () => {
    render(<BadgeGrid badges={BADGES} />);
    expect(screen.getByText('Du har 3 av 4 merker.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Stamgjest, ikke oppnådd ennå' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Styreverv, oppnådd' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Spillforklarer/ })).not.toBeInTheDocument();
  });

  it('opens a badge to read what it is for', async () => {
    render(<BadgeGrid badges={BADGES} />);
    await userEvent.click(screen.getByRole('button', { name: 'Stamgjest, ikke oppnådd ennå' }));
    const dialog = screen.getByRole('dialog', { name: 'Stamgjest' });
    expect(within(dialog).getByText('Sjekket inn 10 ganger.')).toBeInTheDocument();
    expect(
      within(dialog).getByText('Ikke oppnådd ennå: 3 av 10 innsjekkinger.'),
    ).toBeInTheDocument();
  });

  it('encourages a new member, and says so when badges could not be read', () => {
    const { rerender } = render(<BadgeGrid badges={[badge('first-roll')]} />);
    expect(
      screen.getByText('Sjekk inn på et arrangement for å få ditt første merke.'),
    ).toBeInTheDocument();
    rerender(<BadgeGrid badges={null} />);
    expect(screen.getByText('Vi fikk ikke hentet merkene dine akkurat nå.')).toBeInTheDocument();
  });
});
