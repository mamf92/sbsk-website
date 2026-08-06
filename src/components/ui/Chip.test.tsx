import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip, type ChipCategory } from './Chip';

const categories: ChipCategory[] = [
  'neutral',
  'nyheter',
  'spillkveld',
  'arrangementer',
  'turnering',
  'annet',
];

// Pins the contract, not the class values: the category fills change when the design system
// is re-themed, but selection must stay announced and every category must stay distinct.
describe('Chip', () => {
  it('renders its children as an accessible button', () => {
    render(<Chip>Spillkveld</Chip>);
    expect(screen.getByRole('button', { name: 'Spillkveld' })).toBeInTheDocument();
  });

  it('forwards clicks', async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Turnering</Chip>);

    await userEvent.click(screen.getByRole('button', { name: 'Turnering' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('forwards arbitrary button attributes', () => {
    render(
      <Chip aria-label="Filtrer på turnering" disabled>
        Turnering
      </Chip>,
    );

    expect(screen.getByRole('button', { name: 'Filtrer på turnering' })).toBeDisabled();
  });

  it('defaults to type=button so it never submits a surrounding form', () => {
    render(<Chip>Alle</Chip>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('announces selection through aria-pressed', () => {
    const { rerender } = render(<Chip>Alle</Chip>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');

    rerender(<Chip active>Alle</Chip>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('applies a distinct class for every active category', () => {
    const classes = categories.map((category) => {
      const { unmount } = render(
        <Chip active category={category}>
          x
        </Chip>,
      );
      const { className } = screen.getByRole('button');
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(categories.length);
  });

  it('ignores the category until the chip is selected', () => {
    // An unselected chip is one shared outline — category only drives the active fill.
    const classes = categories.map((category) => {
      const { unmount } = render(<Chip category={category}>x</Chip>);
      const { className } = screen.getByRole('button');
      unmount();
      return className;
    });

    expect(new Set(classes).size).toBe(1);
  });

  it('merges a caller-supplied className instead of dropping it', () => {
    render(<Chip className="w-full">Full bredde</Chip>);
    expect(screen.getByRole('button')).toHaveClass('w-full');
  });

  it('exposes the underlying element through a ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<Chip ref={ref}>Ref</Chip>);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('carries lift-chip and never a competing transition utility', () => {
    // `lift-chip` sets `transition` in full. A second transition-property utility would win
    // or lose by stylesheet order and silently drop half the interaction.
    for (const active of [false, true]) {
      const { unmount } = render(<Chip active={active}>x</Chip>);
      const classes = screen.getByRole('button').className.split(/\s+/);
      unmount();

      expect(classes).toContain('lift-chip');
      expect(classes.filter((name) => /^transition(-|$)/.test(name))).toHaveLength(0);
    }
  });
});
