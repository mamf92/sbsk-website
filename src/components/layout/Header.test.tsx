import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { Profile } from '../../supabase/queryHelpers/getProfile';
import Header from './Header';
import { useTranslatedContent } from '../../hooks/locale/useLocale';

const auth = {
  isAuthenticated: false,
  isAdmin: false,
  user: null as Profile | null,
};

vi.mock('../../hooks/authContext/authContext', () => ({
  useAuth: () => ({
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isAdmin: auth.isAdmin,
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

/** Stands in for a translated page's real content, which is what turns the toggle on. */
function TranslatedContent() {
  useTranslatedContent();
  return null;
}

function renderHeader(path = '/', { translated = path !== '/' } = {}) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Header />
      {translated && <TranslatedContent />}
    </MemoryRouter>,
  );
}

// Icon only: a fixed name with the state in `aria-pressed`, so nothing visible has to be
// matched by the name (the old "DM"/"LM" lettering existed for WCAG 2.5.3, #222).
describe('Header — theme toggle', () => {
  it('is an icon-only toggle with a stable name and its state in aria-pressed', () => {
    renderHeader();
    const toggle = screen.getByRole('button', { name: 'Mørk modus' });
    expect(toggle).toHaveTextContent('');
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(toggle).toHaveAttribute('title', 'Bytt til mørk modus');
  });
});

describe('Header — language toggle', () => {
  it('switches language on a page that exists in English', async () => {
    renderHeader('/board-game-masters');
    // One in the bar (sm and up) and one in the mobile menu (below sm); CSS picks which shows.
    const toggles = screen.getAllByRole('button', { name: /^EN\b/ });
    expect(toggles).toHaveLength(2);
    await userEvent.click(toggles[0]);
    expect(screen.getAllByRole('button', { name: /^NO\b/ })).toHaveLength(2);
    expect(localStorage.getItem('sbsk-locale')).toBe('en');
  });

  it('is absent on a page that only exists in Norwegian', () => {
    renderHeader('/om-oss');
    expect(screen.queryAllByRole('button', { name: /^EN\b/ })).toHaveLength(0);
  });

  it('is absent on a translated route showing its Norwegian 404 or placeholder', () => {
    renderHeader('/arrangementer/finnes-ikke', { translated: false });
    expect(screen.queryAllByRole('button', { name: /^EN\b/ })).toHaveLength(0);
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

// The mobile nav renders its own "Min side"/"Logg ut" entries too (hidden only by a `lg:hidden`
// CSS class, not removed from the DOM), so the menu entries are queried by their `menuitem`
// role, which only the desktop profile menu uses.
describe('Header — desktop profile menu', () => {
  beforeEach(() => {
    auth.isAuthenticated = true;
    auth.isAdmin = false;
    // No `name` on the mocked user — the trigger falls back to the fixed "Min profil" label.
    auth.user = { supabase_id: 'member-1' } as Profile;
  });

  it('opens and closes on toggle', async () => {
    renderHeader();
    const trigger = screen.getByRole('button', { name: 'Min profil' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('menu')).toBeNull();

    await userEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await userEvent.click(trigger);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    renderHeader();
    const trigger = screen.getByRole('button', { name: 'Min profil' });
    await userEvent.click(trigger);
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).toBeNull();
    expect(trigger).toHaveFocus();
  });

  it('closes on an outside click', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Min profil' }));
    await userEvent.click(document.body);
    expect(screen.queryByRole('menu')).toBeNull();
  });

  it('stays open when clicking inside its own bounds', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Min profil' }));
    await userEvent.click(screen.getByRole('menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('moves focus through the entries with the arrow keys', async () => {
    renderHeader();
    screen.getByRole('button', { name: 'Min profil' }).focus();
    await userEvent.keyboard('{ArrowDown}');
    const items = await screen.findAllByRole('menuitem');
    await waitFor(() => expect(items[0]).toHaveFocus());
    await userEvent.keyboard('{ArrowDown}');
    expect(items[1]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(items[2]).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}');
    expect(items[0]).toHaveFocus();
    await userEvent.keyboard('{End}');
    expect(items[2]).toHaveFocus();
  });

  it('closes when Tab moves focus out of the menu, without losing focus', async () => {
    renderHeader();
    await userEvent.click(screen.getByRole('button', { name: 'Min profil' }));
    screen.getAllByRole('menuitem').at(-1)!.focus();
    await userEvent.tab();
    expect(screen.queryByRole('menu')).toBeNull();
    expect(document.body).not.toHaveFocus();
  });

  it('has no separate portal button beside the trigger', () => {
    renderHeader('/kalender');
    expect(screen.queryByRole('link', { name: 'Min side' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Styreportal' })).toBeNull();
  });

  it('offers Min side and Logg ut to a member', async () => {
    renderHeader('/kalender');
    await userEvent.click(screen.getByRole('button', { name: 'Min profil' }));
    expect(screen.getByRole('menuitem', { name: 'Min side' })).toHaveAttribute(
      'href',
      '/medlemsportal',
    );
    expect(screen.getByRole('menuitem', { name: 'Logg ut' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Styreportal' })).toBeNull();
  });

  it('adds Styreportal for an admin', async () => {
    auth.isAdmin = true;
    renderHeader('/kalender');
    await userEvent.click(screen.getByRole('button', { name: 'Min profil' }));
    expect(screen.getByRole('menuitem', { name: 'Styreportal' })).toHaveAttribute(
      'href',
      '/styreportal',
    );
    expect(screen.getByRole('menuitem', { name: 'Min side' })).toBeInTheDocument();
  });

  it('shows no portal entries when signed out', () => {
    auth.isAuthenticated = false;
    renderHeader('/kalender');
    expect(screen.queryByRole('button', { name: 'Min profil' })).toBeNull();
    expect(screen.queryByRole('menuitem')).toBeNull();
  });
});

describe('Header — login entry point', () => {
  it('shows a Logg inn link to /login in the desktop bar and the mobile menu when signed out', () => {
    auth.isAuthenticated = false;
    renderHeader();
    const links = screen.getAllByRole('link', { name: 'Logg inn', hidden: true });
    expect(links).toHaveLength(2);
    links.forEach((link) => expect(link).toHaveAttribute('href', '/login'));
  });

  it('shows no Logg inn link when signed in', () => {
    auth.isAuthenticated = true;
    renderHeader();
    expect(screen.queryByRole('link', { name: 'Logg inn', hidden: true })).toBeNull();
    auth.isAuthenticated = false;
  });
});
