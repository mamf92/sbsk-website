import { render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { HomeRedesignData } from '../loaders/home-redesign-loader';
import type { CalendarEventTypes } from '../sanity/queryHelpers/events';
import type { PostTypes } from '../sanity/queryHelpers/posts';
import HomeRedesign from './HomeRedesign';

let loaderData: HomeRedesignData;
let auth: { isAuthenticated: boolean; user: Record<string, unknown> | null };

vi.mock('../hooks/authContext/authContext', () => ({
  useAuth: () => ({ ...auth, authResolved: true, isAdmin: false }),
}));
vi.mock('../supabase/queryHelpers/eventParticipants', () => ({
  getEventAttendees: vi.fn(async () => ({
    Spillkveld: [
      { supabase_id: 'me', name: 'Kari', surname: 'Nordmann', photo_url: '', hidden: false },
      { supabase_id: null, name: null, surname: null, photo_url: '', hidden: true },
    ],
  })),
  joinEvent: vi.fn(),
  leaveEvent: vi.fn(),
}));
vi.mock('../supabase/queryHelpers/getMember', () => ({
  getMember: vi.fn(async () => ({ id: 'm1', name: 'Kari' })),
}));
vi.mock('../supabase/queryHelpers/getMyActivity', () => ({
  getMyActivity: vi.fn(async () => ({ checkIns: 7, signups: 2 })),
}));
vi.mock('../supabase/queryHelpers/badges', () => ({
  getMyBadges: vi.fn(async () => [
    { slug: 'first-roll', kind: 'auto', awarded_at: '2026-09-03', progress: 1, target: 1 },
  ]),
}));
vi.mock('../supabase/queryHelpers/getSeasonStatus', () => ({
  getMemberSeasonStatus: vi.fn(async () => ({ paid: true, paidAt: '2026-01-10' })),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useLoaderData: () => loaderData };
});

function event(id: string, start: string, extra: Partial<CalendarEventTypes> = {}) {
  const startTime = new Date(start);
  return {
    _id: id,
    title: id,
    category: 'spillkveld',
    location: 'Byhaugkafeen, Stavanger',
    eventStartTime: startTime,
    eventEndTime: new Date(startTime.getTime() + 6 * 3600_000),
    ...extra,
  } as CalendarEventTypes;
}

const post = (id: string): PostTypes => ({
  _id: id,
  title: `Innlegg ${id}`,
  slug: { current: id },
  publishedAt: '2026-11-01T10:00:00Z',
  category: 'nyheter',
  content: [],
});

beforeEach(() => {
  auth = { isAuthenticated: false, user: null };
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-27T12:00:00Z'));
  loaderData = {
    homeHero: null,
    posts: [post('a'), post('b')],
    postsFailed: false,
    events: [
      event('Spillkveld', '2026-12-10T16:00:00Z'),
      event('Julespillkveld', '2026-12-17T16:00:00Z', {
        hasDetailPage: true,
        eventSlug: 'jul',
      }),
      event('Vårturnering', '2027-03-13T09:00:00Z', { category: 'turnering' }),
    ],
    eventsFailed: false,
  };
});

afterEach(() => vi.useRealTimers());

const renderPage = () =>
  render(
    <MemoryRouter>
      <HomeRedesign />
    </MemoryRouter>,
  );

describe('HomeRedesign', () => {
  it('makes the next game night the hero', () => {
    renderPage();
    const hero = screen.getByRole('region', { name: 'Neste spillkveld' });
    expect(within(hero).getByText('Torsdag 10. desember')).toBeInTheDocument();
    expect(within(hero).getByText('om 13 dager')).toBeInTheDocument();
    expect(within(hero).getByRole('button', { name: /Legg i kalenderen/ })).toBeInTheDocument();
    expect(within(hero).getByRole('link', { name: 'Vis i kart' })).toHaveAttribute(
      'href',
      expect.stringContaining('openstreetmap.org'),
    );
    // What comes after, in the ticker.
    expect(within(hero).getByText('Julespillkveld')).toBeInTheDocument();
  });

  it('shows the newcomer path, the notice board and posters for special events only', () => {
    renderPage();
    expect(screen.getByRole('heading', { name: 'Tre trekk, så er du i gang' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Innlegg a/ })).toHaveAttribute('href', '/innlegg/a');
    const highlights = screen.getByRole('region', { name: 'Kommende høydepunkter' });
    const titles = within(highlights)
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    expect(titles).toEqual(['Julespillkveld', 'Vårturnering']);
  });

  it('shows the night’s «Beskjed på forsiden» on the hero', () => {
    loaderData = {
      ...loaderData,
      events: [event('Spillkveld', '2026-12-10T16:00:00Z', { frontPageNotice: ' Avlyst ' })],
    };
    renderPage();
    const hero = screen.getByRole('region', { name: 'Neste spillkveld' });
    expect(within(hero).getByText('Avlyst')).toBeInTheDocument();
    expect(within(hero).getByText('Beskjed:', { exact: false })).toBeInTheDocument();
  });

  it('says so when no game night is in the calendar', () => {
    loaderData = { ...loaderData, events: [] };
    renderPage();
    expect(screen.getByText('Neste spillkveld er ikke lagt inn ennå.')).toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'Kommende høydepunkter' })).toBeNull();
  });

  it('swaps in the member view when signed in', async () => {
    auth = {
      isAuthenticated: true,
      user: { supabase_id: 'me', name: 'Kari', surname: 'Nordmann', photo_url: null },
    };
    renderPage();
    const hero = screen.getByRole('region', { name: 'Din neste spillkveld' });
    expect(within(hero).getByText('Hei, Kari!')).toBeInTheDocument();
    expect(await within(hero).findByText('2 kommer')).toBeInTheDocument();
    expect(within(hero).getByRole('button', { name: 'Meld av Spillkveld' })).toBeInTheDocument();
    expect(await within(hero).findByText('Kveld nr. 8 for deg!')).toBeInTheDocument();
    // The member corner replaces «Tre trekk».
    expect(screen.queryByRole('heading', { name: 'Tre trekk, så er du i gang' })).toBeNull();
    const corner = screen.getByRole('region', { name: 'Ditt medlemskap' });
    expect(await within(corner).findByText('Første kast')).toBeInTheDocument();
    expect(within(corner).getByRole('link', { name: 'Min side' })).toHaveAttribute(
      'href',
      '/medlemsportal',
    );
    // Posters offer sign-up.
    const highlights = screen.getByRole('region', { name: 'Kommende høydepunkter' });
    expect(
      within(highlights).getByRole('button', { name: 'Meld på Julespillkveld' }),
    ).toBeInTheDocument();
  });
});
