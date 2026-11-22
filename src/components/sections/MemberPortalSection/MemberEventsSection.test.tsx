import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AdminEvent } from '../../../sanity/queryHelpers/admin-events';

const joinEvent = vi.fn();
const leaveEvent = vi.fn();
const revalidate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useRevalidator: () => ({ revalidate, state: 'idle' }),
}));
vi.mock('../../../supabase/queryHelpers/eventParticipants', () => ({
  joinEvent: (...args: unknown[]) => joinEvent(...args),
  leaveEvent: (...args: unknown[]) => leaveEvent(...args),
}));

const { default: MemberEventsSection } = await import('./MemberEventsSection');

const now = new Date('2026-11-22T12:00:00Z');
const event = (id: string, days: number): AdminEvent => ({
  _id: id,
  _type: 'event',
  title: `Spillkveld ${id}`,
  start: new Date(now.getTime() + days * 86_400_000).toISOString(),
  end: new Date(now.getTime() + days * 86_400_000 + 3_600_000).toISOString(),
  category: 'spillkveld',
  location: null,
  slug: null,
  hasDetailPage: false,
});

function renderSection(joined: string[] = []) {
  render(
    <MemoryRouter>
      <MemberEventsSection
        supabaseId="user-1"
        events={[event('a', 2), event('b', 9), event('c', 20)]}
        joined={joined}
        counts={{ a: 4 }}
        favourite={null}
        failed={false}
        now={now}
      />
    </MemoryRouter>,
  );
}

const mine = () => screen.getByRole('region', { name: 'Mine påmeldinger' });
const suggested = () => screen.getByRole('region', { name: 'Forslag til deg' });

beforeEach(() => {
  joinEvent.mockReset().mockResolvedValue(undefined);
  leaveEvent.mockReset().mockResolvedValue(undefined);
});

describe('MemberEventsSection', () => {
  it('moves a joined suggestion to my sign-ups and counts me in', async () => {
    renderSection();
    expect(within(mine()).getByText(/ikke påmeldt noe ennå/)).toBeInTheDocument();

    await userEvent.click(
      within(suggested()).getByRole('button', { name: 'Meld meg på Spillkveld a' }),
    );

    expect(joinEvent).toHaveBeenCalledWith('a', 'user-1');
    expect(within(mine()).getByText('Spillkveld a')).toBeInTheDocument();
    expect(within(mine()).getByText('5 påmeldt')).toBeInTheDocument();
    expect(within(suggested()).queryByText('Spillkveld a')).not.toBeInTheDocument();
    expect(revalidate).toHaveBeenCalled();
  });

  it('keeps a left event in place so the member can join again', async () => {
    renderSection(['b']);
    await userEvent.click(within(mine()).getByRole('button', { name: 'Meld meg av Spillkveld b' }));
    expect(leaveEvent).toHaveBeenCalledWith('b', 'user-1');
    expect(
      within(mine()).getByRole('button', { name: 'Meld meg på Spillkveld b' }),
    ).toBeInTheDocument();
  });

  it('rolls a failed leave back and says so', async () => {
    leaveEvent.mockRejectedValue(new Error('nope'));
    renderSection(['b']);

    await userEvent.click(within(mine()).getByRole('button', { name: 'Meld meg av Spillkveld b' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Vi fikk ikke meldt deg av');
    expect(within(mine()).getByText('Spillkveld b')).toBeInTheDocument();
  });
});
