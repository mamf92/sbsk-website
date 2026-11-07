import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { Profile } from '../../supabase/queryHelpers/getProfile';
import Header from './Header';

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

vi.mock('../../hooks/theme/ThemeContext', () => ({
  useTheme: () => ({
    theme: 'light',
    isDarkMode: false,
    setTheme: vi.fn(),
    toggleDarkMode: vi.fn(),
  }),
}));

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>,
  );
}

describe('Header — layout (decision 6)', () => {
  it('names the icon-only theme toggle by what it does', () => {
    renderHeader();
    expect(screen.getByRole('button', { name: 'Bytt til mørkt tema' })).toBeInTheDocument();
  });

  it('carries the four main links and nothing else in the main nav', () => {
    renderHeader();
    const nav = screen.getByRole('navigation', { name: 'Hovedmeny' });
    const labels = Array.from(nav.querySelectorAll('a')).map((a) => a.textContent);
    expect(labels).toEqual(['Kalender', 'Våre spill', 'Om oss', 'Kontakt oss']);
  });

  it('makes Bli medlem the one orange action', () => {
    renderHeader();
    const join = screen.getByRole('link', { name: 'Bli medlem' });
    expect(join).toHaveAttribute('href', '/bli-medlem');
    expect(join).toHaveClass('bg-primary');
  });

  it('paints the bar navy and re-points the roles for everything inside it', () => {
    const { container } = renderHeader();
    expect(container.querySelector('header')).toHaveClass('bg-header', 'on-dark');
  });
});

describe('Header — mobile nav tab order', () => {
  it('removes the closed mobile nav panel from the tab order via inert', () => {
    renderHeader();
    expect(screen.getByLabelText('Mobilmeny')).toHaveAttribute('inert');
  });

  it('drops inert once the mobile nav is opened', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Åpne meny' }));
    expect(screen.getByLabelText('Mobilmeny')).not.toHaveAttribute('inert');
  });
});

// The mobile nav renders its own "Profil"/"Logg ut" buttons too (hidden only by a `lg:hidden`
// CSS class, not removed from the DOM), so role queries by name are ambiguous. The dropdown
// panel is the toggle button's next sibling — scope into it to reach the desktop copy only.
function getDropdownPanel() {
  // No `name` on the mocked user — the toggle falls back to the fixed "Min profil" label
  // rather than "Hi, {name}", which keeps this query stable regardless of greeting copy.
  const toggle = screen.getByRole('button', { name: 'Min profil' });
  return toggle.nextElementSibling as HTMLElement;
}

describe('Header — desktop profile dropdown', () => {
  beforeEach(() => {
    auth.isAuthenticated = true;
    auth.user = { supabase_id: 'member-1' } as Profile;
  });

  it('opens and closes on toggle', async () => {
    renderHeader();
    expect(getDropdownPanel()).toHaveClass('hidden');

    await userEvent.click(screen.getByRole('button', { name: 'Min profil' }));
    expect(getDropdownPanel()).not.toHaveClass('hidden');
  });

  it('closes on Escape', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Min profil' }));
    expect(getDropdownPanel()).not.toHaveClass('hidden');

    await userEvent.keyboard('{Escape}');
    expect(getDropdownPanel()).toHaveClass('hidden');
  });

  it('closes on an outside click', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Min profil' }));
    expect(getDropdownPanel()).not.toHaveClass('hidden');

    await userEvent.click(document.body);
    expect(getDropdownPanel()).toHaveClass('hidden');
  });

  it('stays open when clicking inside its own bounds', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Min profil' }));
    await userEvent.click(getDropdownPanel());
    expect(getDropdownPanel()).not.toHaveClass('hidden');
  });
});
