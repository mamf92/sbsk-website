import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from './ThemeContext';

function Probe() {
  const { theme, isDarkMode, toggleDarkMode, setTheme } = useTheme();
  return (
    <>
      <span data-testid="theme">{theme}</span>
      <span data-testid="dark">{String(isDarkMode)}</span>
      <button onClick={toggleDarkMode}>toggle</button>
      <button onClick={() => setTheme('dark')}>darken</button>
    </>
  );
}

function renderProbe() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  );
}

describe('ThemeProvider', () => {
  it('starts from the system preference when nothing is stored', () => {
    renderProbe();
    // `src/test/setup.ts` stubs matchMedia to never match, so this is the "no preference" case.
    expect(screen.getByTestId('theme')).toHaveTextContent('light');
    expect(screen.getByTestId('dark')).toHaveTextContent('false');
  });

  it('starts from a stored preference', () => {
    localStorage.setItem('theme-preference', 'dark');
    renderProbe();
    expect(screen.getByTestId('dark')).toHaveTextContent('true');
  });

  // The bug #247 fixed: mounting used to write the resolved theme back to storage
  // unconditionally, turning a system-derived value into a fake explicit choice.
  it('does not persist a system-derived preference on mount', () => {
    renderProbe();
    expect(localStorage.getItem('theme-preference')).toBeNull();
  });

  it('applies the class and persists the choice when toggled', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
    expect(localStorage.getItem('theme-preference')).toBe('dark');
  });

  it('toggles back off again', async () => {
    const user = userEvent.setup();
    renderProbe();
    const toggle = screen.getByRole('button', { name: 'toggle' });

    await user.click(toggle);
    await user.click(toggle);

    expect(document.documentElement).not.toHaveClass('dark');
    expect(localStorage.getItem('theme-preference')).toBe('light');
  });

  it('setTheme is idempotent', async () => {
    const user = userEvent.setup();
    renderProbe();
    const darken = screen.getByRole('button', { name: 'darken' });

    await user.click(darken);
    await user.click(darken);

    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(document.documentElement).toHaveClass('dark');
  });

  /**
   * The desync this provider was restructured to fix. The old effect wrote storage from every
   * render and never revisited the OS, so a mid-session OS change did nothing until reload, and
   * once storage had been written "follow the system" was gone for good.
   */
  describe('following the OS mid-session', () => {
    type Listener = (event: MediaQueryListEvent) => void;

    function mockSystemTheme(dark: boolean) {
      const listeners: Listener[] = [];
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: dark,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn((_: string, listener: Listener) => listeners.push(listener)),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })) as unknown as typeof window.matchMedia;

      return (matches: boolean) =>
        act(() => listeners.forEach((l) => l({ matches } as MediaQueryListEvent)));
    }

    it('moves the class and the reported state together', () => {
      const emit = mockSystemTheme(false);
      renderProbe();

      emit(true);

      expect(document.documentElement).toHaveClass('dark');
      expect(screen.getByTestId('dark')).toHaveTextContent('true');
    });

    it('leaves one click to turn it back off, not two', async () => {
      const user = userEvent.setup();
      const emit = mockSystemTheme(false);
      renderProbe();
      emit(true);

      await user.click(screen.getByRole('button', { name: 'toggle' }));

      expect(document.documentElement).not.toHaveClass('dark');
      expect(screen.getByTestId('theme')).toHaveTextContent('light');
    });

    it('stops following once the visitor has chosen', async () => {
      const user = userEvent.setup();
      const emit = mockSystemTheme(false);
      renderProbe();

      await user.click(screen.getByRole('button', { name: 'toggle' }));
      emit(false);

      expect(screen.getByTestId('theme')).toHaveTextContent('dark');
      expect(document.documentElement).toHaveClass('dark');
    });
  });

  it('refuses to be used without a provider, rather than silently reporting light mode', () => {
    expect(() => render(<Probe />)).toThrow(/must be used within a ThemeProvider/);
  });
});
