import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MotionProvider } from './MotionProvider';
import { useMotion } from './MotionContext';

function Probe() {
  const { motion, reduced, toggleReducedMotion, setMotion } = useMotion();
  return (
    <>
      <span data-testid="motion">{motion}</span>
      <span data-testid="reduced">{String(reduced)}</span>
      <button onClick={toggleReducedMotion}>toggle</button>
      <button onClick={() => setMotion('reduced')}>reduce</button>
    </>
  );
}

function renderProbe() {
  return render(
    <MotionProvider>
      <Probe />
    </MotionProvider>,
  );
}

describe('MotionProvider', () => {
  it('starts from the system preference when nothing is stored', () => {
    renderProbe();
    // `src/test/setup.ts` stubs matchMedia to never match, so this is the "no preference" case.
    expect(screen.getByTestId('motion')).toHaveTextContent('full');
    expect(screen.getByTestId('reduced')).toHaveTextContent('false');
  });

  it('starts from a stored preference', () => {
    localStorage.setItem('motion-preference', 'reduced');
    renderProbe();
    expect(screen.getByTestId('reduced')).toHaveTextContent('true');
  });

  it('applies the class and persists the choice when toggled', async () => {
    const user = userEvent.setup();
    renderProbe();

    await user.click(screen.getByRole('button', { name: 'toggle' }));

    expect(screen.getByTestId('motion')).toHaveTextContent('reduced');
    expect(document.documentElement).toHaveClass('reduce-motion');
    expect(localStorage.getItem('motion-preference')).toBe('reduced');
  });

  it('toggles back off again', async () => {
    const user = userEvent.setup();
    renderProbe();
    const toggle = screen.getByRole('button', { name: 'toggle' });

    await user.click(toggle);
    await user.click(toggle);

    expect(document.documentElement).not.toHaveClass('reduce-motion');
    expect(localStorage.getItem('motion-preference')).toBe('full');
  });

  it('setMotion is idempotent', async () => {
    const user = userEvent.setup();
    renderProbe();
    const reduce = screen.getByRole('button', { name: 'reduce' });

    await user.click(reduce);
    await user.click(reduce);

    expect(screen.getByTestId('motion')).toHaveTextContent('reduced');
    expect(document.documentElement).toHaveClass('reduce-motion');
  });

  /**
   * The desync this provider was restructured to fix. The subscription used to live in
   * `initMotion` and wrote the class directly, so after an OS change the provider's state was
   * stale: the toggle showed the wrong `aria-pressed`, and its next click rewrote the class to
   * the value it already had — a visual no-op the visitor had to click through twice.
   */
  describe('following the OS mid-session', () => {
    type Listener = (event: MediaQueryListEvent) => void;

    function mockSystemMotion(reduce: boolean) {
      const listeners: Listener[] = [];
      window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: reduce,
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
      const emit = mockSystemMotion(false);
      renderProbe();

      emit(true);

      expect(document.documentElement).toHaveClass('reduce-motion');
      expect(screen.getByTestId('reduced')).toHaveTextContent('true');
    });

    it('leaves one click to turn it back off, not two', async () => {
      const user = userEvent.setup();
      const emit = mockSystemMotion(false);
      renderProbe();
      emit(true);

      await user.click(screen.getByRole('button', { name: 'toggle' }));

      expect(document.documentElement).not.toHaveClass('reduce-motion');
      expect(screen.getByTestId('motion')).toHaveTextContent('full');
    });

    it('stops following once the visitor has chosen', async () => {
      const user = userEvent.setup();
      const emit = mockSystemMotion(false);
      renderProbe();

      await user.click(screen.getByRole('button', { name: 'toggle' }));
      emit(false);

      expect(screen.getByTestId('motion')).toHaveTextContent('reduced');
      expect(document.documentElement).toHaveClass('reduce-motion');
    });
  });

  it('refuses to be used without a provider, rather than silently reporting full motion', () => {
    // The point of the guard: a component that quietly reads `reduced: false` outside the
    // provider would animate for someone who asked it not to.
    expect(() => render(<Probe />)).toThrow(/must be used within a MotionProvider/);
  });
});
