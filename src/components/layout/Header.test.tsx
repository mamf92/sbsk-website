import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import Header from './Header';
import type { Profile } from '../../supabase/queryHelpers/getProfile';

const auth = {
  isAuthenticated: false,
  isAdmin: false,
  user: null as Profile | null,
};

vi.mock('../../hooks/authContext/authContext', () => ({
  useAuth: () => ({
    isAuthenticated: auth.isAuthenticated,
    isAdmin: auth.isAdmin,
    user: auth.user,
    token: null,
    login: vi.fn(),
    logout: vi.fn(),
    refreshSession: vi.fn(),
  }),
}));

vi.mock('../../hooks/theme/ThemeContext', () => ({
  useTheme: () => ({ isDarkMode: false, toggleDarkMode: vi.fn() }),
}));

const renderHeader = () =>
  render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );

// Pins the accordion-style contract `Card`'s own collapsible panel already established:
// closed content must be out of the tab order via `inert`, not just visually hidden.
describe('Header mobile nav', () => {
  it('keeps the closed mobile nav out of the tab order', () => {
    renderHeader();
    expect(screen.getByLabelText('Mobilmeny')).toHaveAttribute('inert');
  });

  it('removes inert from the mobile nav once opened', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: /meny/i }));
    expect(screen.getByLabelText('Mobilmeny')).not.toHaveAttribute('inert');
  });
});

describe('Header profile dropdown', () => {
  beforeEach(() => {
    auth.isAuthenticated = true;
    auth.isAdmin = false;
    // No `name` — the toggle button falls back to the fixed "Min profil" label rather than
    // "Hi, {name}", which keeps the queries below stable regardless of the greeting copy.
    auth.user = null;
  });

  // The dropdown hides via a bare `hidden` class swap (no `inert`, no unmount) — correct in a
  // real browser, since `display: none` already drops an element from the tab order, but it
  // means jsdom (which never loads the real stylesheet) keeps the menu's buttons queryable by
  // role regardless of open/closed state. The same authenticated controls also render inside the
  // mobile nav's `inert`-when-closed panel, which jsdom likewise doesn't cascade into role-query
  // exclusion (`Card.test.tsx` hits the identical gap). So rather than asserting presence, every
  // check below reads the menu container's own `hidden` class directly, scoped to the desktop
  // dropdown so it can't be confused with its mobile-nav twin.
  function openDropdown() {
    renderHeader();
    const toggle = screen.getByRole('button', { name: /min profil/i });
    const dropdown = within(toggle.parentElement as HTMLElement);
    const menu = () =>
      dropdown.getByRole('button', { name: 'Logg ut' }).parentElement as HTMLElement;
    return { toggle, dropdown, menu };
  }

  it('opens and closes on toggle', async () => {
    const { toggle, menu } = openDropdown();

    expect(menu()).toHaveClass('hidden');
    await userEvent.click(toggle);
    expect(menu()).not.toHaveClass('hidden');
  });

  it('closes on Escape', async () => {
    const { toggle, menu } = openDropdown();
    await userEvent.click(toggle);
    expect(menu()).not.toHaveClass('hidden');

    await userEvent.keyboard('{Escape}');
    expect(menu()).toHaveClass('hidden');
  });

  it('closes on an outside click', async () => {
    const { toggle, menu } = openDropdown();
    await userEvent.click(toggle);
    expect(menu()).not.toHaveClass('hidden');

    // The wordmark link sits well outside the dropdown.
    await userEvent.click(screen.getByRole('link', { name: 'SBSK' }));
    expect(menu()).toHaveClass('hidden');
  });

  it('does not close on a click inside the dropdown', async () => {
    const { toggle, menu } = openDropdown();
    await userEvent.click(toggle);
    // Clicking the menu's own container (not a link or button) should not be treated as an
    // outside click.
    await userEvent.click(menu());
    expect(menu()).not.toHaveClass('hidden');
  });
});
