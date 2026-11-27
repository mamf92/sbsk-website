import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { CalendarEventTypes } from '../../../sanity/queryHelpers/events';
import { EventPageRedesign } from './EventPageRedesign';

let auth: { isAuthenticated: boolean; user: Record<string, unknown> | null };

vi.mock('../../../hooks/authContext/authContext', () => ({
  useAuth: () => ({ ...auth, authResolved: true, isAdmin: false }),
}));
vi.mock('../../../supabase/queryHelpers/eventParticipants', () => ({
  getEventAttendees: vi.fn(async () => ({})),
  joinEvent: vi.fn(),
  leaveEvent: vi.fn(),
}));
vi.mock('../../../sanity/editors/portableTextComponents', () => ({ components: {} }));
vi.mock('../../../sanity/sanityImageUrl', () => ({
  urlFor: () => ({
    width: () => ({
      fit: () => ({ auto: () => ({ url: () => 'https://cdn.test/i.jpg' }), url: () => 'x' }),
      url: () => 'https://cdn.test/i.jpg',
    }),
  }),
}));

const block = (text: string) =>
  [
    { _type: 'block', _key: text, children: [{ _type: 'span', _key: `${text}-s`, text }] },
  ] as CalendarEventTypes['content'];

const tournament: CalendarEventTypes = {
  _id: 'vaar',
  title: 'Vårturnering i Catan',
  category: 'turnering',
  eventStartTime: new Date('2099-03-13T09:00:00Z'),
  eventEndTime: new Date('2099-03-13T16:00:00Z'),
  hasDetailPage: true,
  content: block('Innledende runder og finale.'),
  pricingInfo: block('Startkontingent: 150 kr per spiller.'),
  programInfo: block('Første runde starter 10.00.'),
  venue: {
    name: 'Tasta bydelshus',
    address: 'Eksempelveien 1',
    doorsOpen: '09:30',
    meetingPoint: { nb: 'Hovedsalen' },
  },
  signup: {
    method: 'spond',
    url: 'https://spond.com/x',
    opens: '2000-01-01T00:00:00Z',
    capacity: 32,
    note: { nb: 'Prisen inkluderer lunsj.' },
  },
  showSponsors: true,
  sponsors: [{ altText: 'Outland', tier: 'hovedsponsor' }],
};

const dropIn: CalendarEventTypes = {
  _id: 'laer',
  title: 'Lær å spille-kveld',
  category: 'annet',
  eventStartTime: new Date('2099-12-12T11:00:00Z'),
  eventEndTime: new Date('2099-12-12T16:00:00Z'),
  hasDetailPage: true,
  location: 'Byhaugkafeen',
  signup: { method: 'oppmote', note: { nb: 'Gratis for alle.' } },
};

const renderPage = (event: CalendarEventTypes) =>
  render(
    <MemoryRouter>
      <EventPageRedesign event={event} />
    </MemoryRouter>,
  );

beforeEach(() => {
  auth = { isAuthenticated: false, user: null };
});

describe('EventPageRedesign', () => {
  it('answers when, where, price and sign-up in the hero, with one way to sign up', () => {
    renderPage(tournament);
    expect(screen.getByRole('heading', { level: 1, name: 'Vårturnering i Catan' })).toBeVisible();
    expect(screen.getByText('Dørene åpner 09:30')).toBeInTheDocument();
    expect(screen.getByText('Eksempelveien 1')).toBeInTheDocument();
    expect(screen.getByText('Startkontingent: 150 kr per spiller.')).toBeInTheDocument();
    expect(screen.getByText(/Påmelding åpen · 32 plasser/)).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /Meld deg på/ })).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Bli med' })).not.toBeInTheDocument();
  });

  it('puts only what the hero does not say in «Godt å vite»', () => {
    renderPage(tournament);
    const card = screen.getByRole('heading', { name: 'Godt å vite' }).parentElement!;
    expect(within(card).getByText('Hovedsalen')).toBeInTheDocument();
    expect(within(card).getByText('Prisen inkluderer lunsj.')).toBeInTheDocument();
    expect(within(card).queryByText(/150 kr/)).not.toBeInTheDocument();
    expect(within(card).queryByText(/09:30/)).not.toBeInTheDocument();
  });

  it('shows each sponsor once', () => {
    renderPage(tournament);
    expect(screen.getAllByRole('region', { name: 'Med støtte fra' })).toHaveLength(1);
  });

  it('on a drop-in event says the note, makes the calendar the main button and drops the card', () => {
    renderPage(dropIn);
    expect(screen.getByText('Gratis for alle.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Legg til Lær å spille-kveld i kalenderen/ }),
    ).toBeVisible();
    expect(screen.queryByRole('heading', { name: 'Godt å vite' })).not.toBeInTheDocument();
    expect(screen.getByText('Arrangement')).toBeInTheDocument();
  });

  it('gives a member «Bli med» only on a drop-in event', () => {
    auth = { isAuthenticated: true, user: { name: 'Kari' } };
    const { unmount } = renderPage(dropIn);
    expect(screen.getByRole('button', { name: /Meld på Lær å spille-kveld/ })).toHaveTextContent(
      'Bli med',
    );
    unmount();
    renderPage(tournament);
    expect(screen.queryByText('Bli med')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Meld deg på/ })).toBeInTheDocument();
  });

  it('says a past event is over and offers no buttons', () => {
    renderPage({
      ...dropIn,
      eventStartTime: new Date('2020-01-01T10:00:00Z'),
      eventEndTime: new Date('2020-01-01T12:00:00Z'),
    });
    expect(screen.getByText('Arrangementet er over')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('shows the front-page notice on the hero', () => {
    renderPage({ ...dropIn, frontPageNotice: 'Avlyst' });
    expect(screen.getByText('Avlyst')).toBeInTheDocument();
  });

  it('gives a multi-day event both of its dates', () => {
    renderPage({
      ...dropIn,
      eventStartTime: new Date('2099-03-13T09:00:00Z'),
      eventEndTime: new Date('2099-03-15T16:00:00Z'),
    });
    expect(screen.getByText(/13\..*15\. mars/)).toBeInTheDocument();
  });
});
