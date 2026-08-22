import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { CalendarEventTypes } from '../../sanity/queryHelpers/events';
import type { Profile } from '../../supabase/queryHelpers/getProfile';
import CalendarSection from './CalendarSection';

// The clock the whole suite reasons about. "Upcoming" and "past" are relative to it, so it has
// to be pinned before anything renders.
const NOW = new Date('2026-08-10T12:00:00');

const member = {
  supabase_id: 'member-1',
  name: 'Martin',
  surname: 'Fischer',
  photo_url: '',
} as unknown as Profile;

const auth = {
  isAuthenticated: false,
  user: null as Profile | null,
};

vi.mock('../../hooks/authContext/authContext', () => ({
  useAuth: () => ({
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isAdmin: false,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
  }),
}));

vi.mock('../../sanity/editors/portableTextComponents', () => ({ components: {} }));

vi.mock('../../sanity/sanityImageUrl', () => ({
  urlFor: () => ({
    width: () => ({ fit: () => ({ url: () => 'https://example.test/image.jpg' }) }),
  }),
}));

const addParticipantToEvent = vi.fn().mockResolvedValue(undefined);
const removeParticipantFromEvent = vi.fn().mockResolvedValue(undefined);

vi.mock('../../sanity/queryHelpers/updateEventParticipants', () => ({
  createParticipantFromProfile: (user: Profile) => ({
    supabase_id: user.supabase_id,
    name: user.name ?? '',
    surname: user.surname ?? '',
    photo_url: user.photo_url ?? '',
  }),
  addParticipantToEvent: (...args: unknown[]) => addParticipantToEvent(...args),
  removeParticipantFromEvent: (...args: unknown[]) => removeParticipantFromEvent(...args),
}));

const body = [
  {
    _type: 'block',
    _key: 'block-1',
    children: [{ _type: 'span', _key: 'span-1', text: 'Beskrivelse av arrangementet.' }],
  },
] as CalendarEventTypes['content'];

const events: CalendarEventTypes[] = [
  {
    _id: 'past-summer',
    title: 'Sommerspillkveld',
    category: 'spillkveld',
    location: 'Klubbhuset',
    eventStartTime: new Date('2026-07-14T18:00:00'),
    eventEndTime: new Date('2026-07-14T22:00:00'),
    content: body,
  },
  {
    _id: 'next-up',
    title: 'Ukentlig spillkveld',
    category: 'spillkveld',
    location: 'Klubbhuset, Stavanger',
    eventStartTime: new Date('2026-08-12T18:00:00'),
    eventEndTime: new Date('2026-08-12T22:00:00'),
    content: body,
    participants: [
      { _key: 'p1', supabase_id: 'a', name: 'Anne', surname: 'Berg', photo_url: '' },
      { _key: 'p2', supabase_id: 'b', name: 'Kari', surname: 'Lund', photo_url: '' },
      { _key: 'p3', supabase_id: 'c', name: 'Tor', surname: 'Solberg', photo_url: '' },
      { _key: 'p4', supabase_id: 'd', name: 'Rita', surname: 'Nilsen', photo_url: '' },
    ],
  },
  {
    _id: 'later-august',
    title: 'Spillkveld nummer to',
    category: 'spillkveld',
    eventStartTime: new Date('2026-08-19T18:00:00'),
    eventEndTime: new Date('2026-08-19T22:00:00'),
  },
  {
    _id: 'autumn-cup',
    title: 'Høstturnering',
    category: 'turnering',
    eventSlug: 'hostturnering',
    eventStartTime: new Date('2026-09-20T10:00:00'),
    eventEndTime: new Date('2026-09-20T18:00:00'),
    content: body,
  },
];

const renderSection = (props: Partial<Parameters<typeof CalendarSection>[0]> = {}) =>
  render(
    <MemoryRouter>
      <CalendarSection events={events} {...props} />
    </MemoryRouter>,
  );

/** The card wrapper an event heading sits in, so assertions can scope to one row. */
const card = (title: string) =>
  screen.getByRole('heading', { name: title }).closest('[data-event-id]') as HTMLElement;

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.setSystemTime(NOW);
  auth.isAuthenticated = false;
  auth.user = null;
  addParticipantToEvent.mockClear();
  removeParticipantFromEvent.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('CalendarSection', () => {
  it('highlights the next upcoming event and opens it by default', () => {
    renderSection();

    expect(screen.getByText('Neste arrangement')).toBeInTheDocument();
    // 10 August → 12 August is two days out.
    expect(screen.getByText('Om 2 dager')).toBeInTheDocument();

    const next = card('Ukentlig spillkveld');
    expect(within(next).getByRole('button', { name: /Skjul/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('groups the remaining events under uppercase month dividers', () => {
    renderSection();

    // The featured event is lifted out of its month group, so August holds only the later one.
    expect(screen.getByText('AUGUST 2026')).toBeInTheDocument();
    expect(screen.getByText('SEPTEMBER 2026')).toBeInTheDocument();
  });

  it('shows only upcoming events until the scope is changed', async () => {
    renderSection();
    expect(screen.queryByRole('heading', { name: 'Sommerspillkveld' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Tidligere' }));

    expect(screen.getByRole('heading', { name: 'Sommerspillkveld' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Høstturnering' })).not.toBeInTheDocument();
    // The next-event highlight is a "what's next" reading — it has no place in the archive.
    expect(screen.queryByText('Neste arrangement')).not.toBeInTheDocument();
  });

  it('filters by category', async () => {
    renderSection();

    await userEvent.click(screen.getByRole('button', { name: 'Turnering' }));

    expect(screen.getByRole('heading', { name: 'Høstturnering' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Ukentlig spillkveld' })).not.toBeInTheDocument();
  });

  it('searches across title, location and body copy', async () => {
    renderSection();

    await userEvent.type(screen.getByRole('searchbox'), 'Stavanger');

    expect(screen.getByRole('heading', { name: 'Ukentlig spillkveld' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Høstturnering' })).not.toBeInTheDocument();
  });

  it('offers a way out when nothing matches', async () => {
    renderSection();

    await userEvent.type(screen.getByRole('searchbox'), 'finnes ikke');
    expect(
      screen.getByRole('heading', { name: 'Ingen arrangementer matcher søket' }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Fjern filtre/ }));
    expect(screen.getByRole('heading', { name: 'Ukentlig spillkveld' })).toBeInTheDocument();
  });

  it('keeps attendees and RSVP behind the login', () => {
    renderSection();

    expect(screen.queryByRole('button', { name: /Meld deg på/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: 'Anne Berg' })).not.toBeInTheDocument();
  });

  it('shows the avatar stack and RSVP button to a logged-in member', () => {
    auth.isAuthenticated = true;
    auth.user = member;
    renderSection();

    const next = card('Ukentlig spillkveld');
    expect(within(next).getByRole('img', { name: 'Anne Berg' })).toBeInTheDocument();
    // Four attendees, three shown, one folded into the counter.
    expect(within(next).getByText('+1')).toBeInTheDocument();
    expect(within(next).getByRole('button', { name: /Meld deg på/ })).toHaveTextContent('Bli med');
  });

  it('joins an event optimistically', async () => {
    auth.isAuthenticated = true;
    auth.user = member;
    renderSection();

    const next = card('Ukentlig spillkveld');
    await userEvent.click(within(next).getByRole('button', { name: /Meld deg på/ }));

    expect(addParticipantToEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: 'next-up' }),
    );
    expect(within(next).getByRole('button', { name: /Meld deg av/ })).toHaveTextContent('Påmeldt!');
  });

  it('rolls the join back and explains itself when the write fails', async () => {
    auth.isAuthenticated = true;
    auth.user = member;
    addParticipantToEvent.mockRejectedValueOnce(new Error('nope'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderSection();

    const next = card('Ukentlig spillkveld');
    await userEvent.click(within(next).getByRole('button', { name: /Meld deg på/ }));

    expect(await within(next).findByRole('status')).toHaveTextContent(
      'Kunne ikke melde deg på arrangementet.',
    );
    expect(within(next).getByRole('button', { name: /Meld deg på/ })).toHaveTextContent('Bli med');
  });

  it('narrows to the member’s own events', async () => {
    auth.isAuthenticated = true;
    auth.user = member;
    renderSection();

    await userEvent.click(screen.getByRole('button', { name: /Mine kommende/ }));
    expect(
      screen.getByText('Du er ikke påmeldt noen kommende arrangementer ennå.'),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /Fjern filtre/ }));
    const next = card('Ukentlig spillkveld');
    await userEvent.click(within(next).getByRole('button', { name: /Meld deg på/ }));
    await userEvent.click(screen.getByRole('button', { name: /Mine kommende/ }));

    expect(screen.getByRole('heading', { name: 'Ukentlig spillkveld' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Høstturnering' })).not.toBeInTheDocument();
  });

  it('expands and collapses an event through the chevron', async () => {
    renderSection();

    const autumn = card('Høstturnering');
    const chevron = within(autumn).getByRole('button', { name: /Vis mer/ });
    expect(chevron).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(chevron);
    expect(within(autumn).getByRole('button', { name: /Skjul/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
    // Opening one closes the other — the list keeps a single panel open.
    expect(
      within(card('Ukentlig spillkveld')).getByRole('button', { name: /Vis mer/ }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  it('links an event with a page of its own out to that page', async () => {
    renderSection();

    // Høstturnering has a slug, so its open panel offers the route to the detail page.
    await userEvent.click(within(card('Høstturnering')).getByRole('button', { name: /Vis mer/ }));
    expect(
      within(card('Høstturnering')).getByRole('button', { name: 'Se arrangementet' }),
    ).toBeInTheDocument();
  });

  it('gives an event with nothing to open no expand affordance at all', () => {
    renderSection();

    const plain = card('Spillkveld nummer to');
    expect(within(plain).queryByRole('button', { name: /Vis mer/ })).not.toBeInTheDocument();
  });

  it('renders the compact heading instead of the hero in portal mode', () => {
    renderSection({ compact: true });

    expect(screen.getByRole('heading', { level: 2, name: 'Kalender' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 1 })).not.toBeInTheDocument();
  });

  it('spells out the year on a range that crosses into a new one', () => {
    render(
      <MemoryRouter>
        <CalendarSection
          events={[
            {
              _id: 'new-year',
              title: 'Nyttårsspill',
              category: 'annet',
              eventStartTime: new Date('2026-12-31T20:00:00'),
              eventEndTime: new Date('2027-01-01T02:00:00'),
            },
          ]}
        />
      </MemoryRouter>,
    );

    // Without the year this would read "31. des. – 1. jan.", which looks backwards.
    expect(screen.getByText(/2026.*2027/)).toBeInTheDocument();
  });

  it('falls back to its own empty state when there are no events', () => {
    render(
      <MemoryRouter>
        <CalendarSection events={[]} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Ingen arrangementer' })).toBeInTheDocument();
  });
});
