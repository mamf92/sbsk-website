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
  'spillkveldKalender',
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

  it('previews its category on the border and never paints a hover fill', () => {
    // An unselected chip shares one resting outline, but previews its own category's colour
    // on hover so a filter signals what it filters to before it is ever pressed (#203). The
    // preview is border-only: the 10% category fill this used to add read as a washed yellow
    // on the orange-family categories and sat too close to the selected fill (#223).
    const borders = new Set<string>();

    for (const category of categories) {
      const { unmount } = render(<Chip category={category}>x</Chip>);
      const classes = screen.getByRole('button').className.split(/\s+/);
      unmount();

      expect(classes.filter((name) => name.includes('hover:bg-'))).toHaveLength(0);
      const border = classes.find((name) => name.startsWith('hover:border-'));
      expect(border).toBeDefined();
      borders.add(border!);
    }

    // Not one per category — categories that share a card colour share a border preview. What
    // matters is that the preview is category-coded at all rather than one shared hover.
    expect(borders.size).toBeGreaterThan(1);
  });

  it('keeps the resting (non-hover) treatment identical across categories', () => {
    // Only the hover preview is category-coded — the resting border, fill and text stay one
    // shared look until the pointer arrives.
    const classes = categories.map((category) => {
      const { unmount } = render(<Chip category={category}>x</Chip>);
      const { className } = screen.getByRole('button');
      unmount();
      return className
        .split(/\s+/)
        .filter((name) => !name.startsWith('hover:') && !name.startsWith('dark:hover:'))
        .sort()
        .join(' ');
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
