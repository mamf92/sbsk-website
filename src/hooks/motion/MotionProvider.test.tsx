import { describe, expect, it, vi } from 'vitest';
import { act } from 'react';
import { render, screen } from '@testing-library/react';
import { MotionProvider } from './MotionProvider';
import { useMotion } from './MotionContext';

function Probe() {
  const { motion, reduced } = useMotion();
  return (
    <>
      <span data-testid="motion">{motion}</span>
      <span data-testid="reduced">{String(reduced)}</span>
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

// Reduced motion follows the OS and nothing else (decision 3).
describe('MotionProvider', () => {
  it('starts from the OS setting', () => {
    renderProbe();
    // `src/test/setup.ts` stubs matchMedia to never match, so this is the "no preference" case.
    expect(screen.getByTestId('motion')).toHaveTextContent('full');
    expect(screen.getByTestId('reduced')).toHaveTextContent('false');
  });

  it('starts reduced when the OS asks for it', () => {
    mockSystemMotion(true);
    renderProbe();
    expect(screen.getByTestId('reduced')).toHaveTextContent('true');
    expect(document.documentElement).toHaveClass('reduce-motion');
  });

  it('ignores a preference stored by the retired on-site switch', () => {
    mockSystemMotion(false);
    localStorage.setItem('motion-preference', 'reduced');
    renderProbe();
    expect(screen.getByTestId('reduced')).toHaveTextContent('false');
  });

  it('follows an OS change mid-session, moving the class and the state together', () => {
    const emit = mockSystemMotion(false);
    renderProbe();

    emit(true);
    expect(document.documentElement).toHaveClass('reduce-motion');
    expect(screen.getByTestId('reduced')).toHaveTextContent('true');

    emit(false);
    expect(document.documentElement).not.toHaveClass('reduce-motion');
  });

  it('refuses to be used without a provider, rather than silently reporting full motion', () => {
    // The point of the guard: a component that quietly reads `reduced: false` outside the
    // provider would animate for someone who asked it not to.
    expect(() => render(<Probe />)).toThrow(/must be used within a MotionProvider/);
  });
});
