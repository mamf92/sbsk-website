import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NavMenuButton } from './NavMenuButton';

describe('NavMenuButton', () => {
  it('exposes a Norwegian label that reflects what the next press will do', () => {
    const { rerender } = render(<NavMenuButton />);
    expect(screen.getByRole('button', { name: 'Åpne meny' })).toBeInTheDocument();

    rerender(<NavMenuButton open />);
    expect(screen.getByRole('button', { name: 'Lukk meny' })).toBeInTheDocument();
  });

  it('announces the menu state through aria-expanded', () => {
    const { rerender } = render(<NavMenuButton />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');

    rerender(<NavMenuButton open />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('forwards clicks', async () => {
    const onClick = vi.fn();
    render(<NavMenuButton onClick={onClick} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('lets a caller override the default label', () => {
    render(<NavMenuButton aria-label="Hovedmeny" />);
    expect(screen.getByRole('button', { name: 'Hovedmeny' })).toBeInTheDocument();
  });

  it('defaults to type=button so it never submits a surrounding form', () => {
    render(<NavMenuButton />);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('renders three bars, and folds them into an X when open', () => {
    const { container, rerender } = render(<NavMenuButton />);
    const bars = () => Array.from(container.querySelectorAll('span'));

    expect(bars()).toHaveLength(3);
    // Closed: no bar is transformed and the middle bar is visible.
    expect(bars().some((bar) => /rotate|translate/.test(bar.className))).toBe(false);
    expect(bars()[1].className).toContain('opacity-100');

    rerender(<NavMenuButton open />);
    expect(bars()[0].className).toContain('rotate-45');
    expect(bars()[2].className).toContain('-rotate-45');
    // The middle bar has nothing to rotate into — it fades instead.
    expect(bars()[1].className).toContain('opacity-0');
  });

  it('merges a caller-supplied className instead of dropping it', () => {
    render(<NavMenuButton className="lg:hidden" />);
    expect(screen.getByRole('button')).toHaveClass('lg:hidden');
  });

  it('exposes the underlying element through a ref', () => {
    const ref = { current: null as HTMLButtonElement | null };
    render(<NavMenuButton ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('carries lift and never a competing transition utility', () => {
    render(<NavMenuButton />);
    const classes = screen.getByRole('button').className.split(/\s+/);

    expect(classes).toContain('lift');
    expect(classes.filter((name) => /^transition(-|$)/.test(name))).toHaveLength(0);
  });
});
