import { render, screen, act } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DiceLogo } from './DiceLogo';
import type { DiceLogoHandle } from './DiceLogo';

describe('DiceLogo', () => {
  it('renders as a button with an accessible label announcing the face', () => {
    render(<DiceLogo initialFace={3} />);

    const btn = screen.getByRole('button', { name: /Terning viser 3/ });
    expect(btn).toBeInTheDocument();
  });

  it('contains an SVG that is hidden from assistive tech', () => {
    const { container } = render(<DiceLogo />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
  });

  it('fires onRoll after a click', () => {
    vi.useFakeTimers();
    const onRoll = vi.fn();
    render(<DiceLogo onRoll={onRoll} />);

    const btn = screen.getByRole('button');
    act(() => {
      btn.click();
    });
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onRoll).toHaveBeenCalledTimes(1);
    expect(onRoll).toHaveBeenCalledWith(expect.any(Number));
    vi.useRealTimers();
  });

  it('exposes a roll() method via the imperative handle', () => {
    const ref = createRef<DiceLogoHandle>();
    render(<DiceLogo ref={ref} />);

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.roll).toBe('function');
  });

  it('applies the rolling class during a roll', () => {
    vi.useFakeTimers();
    render(<DiceLogo />);

    const btn = screen.getByRole('button');
    act(() => {
      btn.click();
    });

    expect(btn.className).toContain('rolling');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(btn.className).not.toContain('rolling');
    vi.useRealTimers();
  });

  it('merges caller className', () => {
    render(<DiceLogo className="custom-extra" />);

    expect(screen.getByRole('button').className).toContain('custom-extra');
  });

  it('spreads native button attributes', () => {
    render(<DiceLogo data-testid="my-dice" />);

    expect(screen.getByTestId('my-dice')).toBeInTheDocument();
  });

  it('respects the size prop on the SVG', () => {
    const { container } = render(<DiceLogo size={100} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveStyle({ height: '100px', width: '100px' });
  });
});
