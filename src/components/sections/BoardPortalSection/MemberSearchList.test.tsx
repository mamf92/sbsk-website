import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MemberSearchList from './MemberSearchList';
import type { Member } from '../../../supabase/queryHelpers/getMember';

vi.mock('react-router-dom', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router-dom')>()),
  useRevalidator: () => ({ revalidate: vi.fn(), state: 'idle' }),
}));

vi.mock('../../../supabase/queryHelpers/editMember', () => ({
  editMember: vi.fn().mockResolvedValue(undefined),
}));
vi.mock('../../../supabase/queryHelpers/createMember', () => ({
  createMember: vi.fn().mockResolvedValue(undefined),
}));

const members: Member[] = [
  {
    id: 'member-1',
    name: 'Trygve',
    surname: 'Dahl',
    phone: '40000001',
    address: 'Madlaveien 12',
    postcode: '4009',
    city: 'Stavanger',
    email: 'trygve@example.test',
    is_admin: false,
    supabase_id: 'aaaaaaaa-0000-4000-8000-000000000001',
    created_at: '2026-02-01T09:00:00Z',
  },
];

function renderList() {
  return render(
    <MemoryRouter>
      <MemberSearchList members={members} />
    </MemoryRouter>,
  );
}

describe('MemberSearchList — keyboard operability (#168)', () => {
  it('renders the member rows as a list of focusable, labelled buttons', () => {
    renderList();

    const row = screen.getByRole('button', { name: 'Vis Trygve Dahl' });
    expect(row.tagName).toBe('LI');
    expect(row.closest('ul')).not.toBeNull();
    expect(row).toHaveAttribute('tabIndex', '0');
  });

  it('opens the member for editing on Enter', async () => {
    renderList();

    screen.getByRole('button', { name: 'Vis Trygve Dahl' }).focus();
    await userEvent.keyboard('{Enter}');

    expect(screen.getByRole('heading', { name: 'Rediger medlem' })).toBeInTheDocument();
  });

  it('opens the member for editing on Space', async () => {
    renderList();

    screen.getByRole('button', { name: 'Vis Trygve Dahl' }).focus();
    await userEvent.keyboard(' ');

    expect(screen.getByRole('heading', { name: 'Rediger medlem' })).toBeInTheDocument();
  });

  it('still opens on a mouse click', async () => {
    renderList();

    await userEvent.click(screen.getByRole('button', { name: 'Vis Trygve Dahl' }));

    expect(screen.getByRole('heading', { name: 'Rediger medlem' })).toBeInTheDocument();
  });
});
