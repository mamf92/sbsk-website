import { describe, expect, it } from 'vitest';
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

  it('refuses to be used without a provider, rather than silently reporting full motion', () => {
    // The point of the guard: a component that quietly reads `reduced: false` outside the
    // provider would animate for someone who asked it not to.
    expect(() => render(<Probe />)).toThrow(/must be used within a MotionProvider/);
  });
});
