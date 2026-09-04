import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import OurGamesSection from './OurGamesSection';
import type { GameTypes } from '../../sanity/queryHelpers/games';

const auth = { isAuthenticated: false };

vi.mock('../../hooks/authContext/authContext', () => ({
  useAuth: () => ({ isAuthenticated: auth.isAuthenticated }),
}));

vi.mock('../../sanity/sanityImageUrl', () => ({
  urlFor: () => ({
    width: () => ({
      height: () => ({ fit: () => ({ url: () => 'https://example.test/image.jpg' }) }),
    }),
  }),
}));

const games: GameTypes[] = [
  {
    _id: 'g1',
    title: 'Tie Break',
    genre: 'Strategi · Testspill',
    difficulty: 1,
    time: '20',
    players: '2–4',
    playersMin: 2,
    playersMax: 4,
  },
  {
    _id: 'g2',
    title: 'Storgruppe',
    genre: 'Party · Testspill',
    difficulty: 3,
    time: '30',
    players: '5–8',
    playersMin: 5,
    playersMax: 8,
  },
];

const renderSection = (list: GameTypes[] = games) =>
  render(
    <MemoryRouter>
      <OurGamesSection games={list} />
    </MemoryRouter>,
  );

beforeEach(() => {
  auth.isAuthenticated = false;
});

describe('OurGamesSection', () => {
  it('renders the games passed in when there are any', () => {
    renderSection();
    expect(screen.getByText('Tie Break')).toBeInTheDocument();
    expect(screen.getByText('Storgruppe')).toBeInTheDocument();
  });

  it('falls back to the club’s own collection when Sanity has no games yet', () => {
    renderSection([]);
    expect(screen.getByText('Wingspan')).toBeInTheDocument();
    expect(screen.queryByText('Tie Break')).not.toBeInTheDocument();
  });

  it('filters by search text across title and genre', async () => {
    renderSection();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Søk etter spill' }), 'storgruppe');

    expect(screen.getByText('Storgruppe')).toBeInTheDocument();
    expect(screen.queryByText('Tie Break')).not.toBeInTheDocument();
  });

  it('filters by difficulty', async () => {
    renderSection();
    await userEvent.click(screen.getByRole('button', { name: 'Avansert' }));

    expect(screen.getByText('Storgruppe')).toBeInTheDocument();
    expect(screen.queryByText('Tie Break')).not.toBeInTheDocument();
  });

  it('filters by player count on overlap, not containment', async () => {
    renderSection();
    // "5+" (lo 5, hi 99) excludes Tie Break's 2–4 range entirely.
    await userEvent.click(screen.getByRole('button', { name: '5+' }));

    expect(screen.getByText('Storgruppe')).toBeInTheDocument();
    expect(screen.queryByText('Tie Break')).not.toBeInTheDocument();
  });

  it('shows an empty state with a reset action when nothing matches', async () => {
    renderSection();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Søk etter spill' }), 'finnes ikke');

    expect(screen.getByText('Ingen spill matcher søket')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Fjern filtre/ }));

    expect(screen.getByText('Tie Break')).toBeInTheDocument();
    expect(screen.getByText('Storgruppe')).toBeInTheDocument();
  });

  it('opens the discount dialog for a member instead of navigating straight out', async () => {
    auth.isAuthenticated = true;
    renderSection();

    await userEvent.click(screen.getAllByRole('link', { name: /Kjøp med −15 % rabatt/ })[0]);

    expect(screen.getByRole('dialog', { name: 'Rabattkode kopiert' })).toBeInTheDocument();
    expect(screen.getByText('SBSK15')).toBeInTheDocument();
  });
});
